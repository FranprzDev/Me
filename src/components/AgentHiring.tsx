"use client";

import { useRef, useState, type ChangeEvent, type DragEvent, type FormEvent } from "react";
import Link from "next/link";
import { CV } from "@/data/cv";
import { useI18n } from "@/lib/i18n";
import {
  createRecruiterIndex,
  embedQuestion,
  jobDescriptionToMarkdown,
  rankEvidence,
  rankRequirements,
  type Evidence,
} from "@/lib/recruiter-search";

interface ChatMessage {
  role: "recruiter" | "portfolio";
  text: string;
  sources?: Evidence[];
}

const PROMPTS = [
  { es: "¿Francisco es adecuado para este puesto?", en: "Is Francisco a good fit for this role?" },
  { es: "¿Qué experiencia tiene con IA y RAG?", en: "What experience does he have with AI and RAG?" },
  { es: "¿Cumple los años de experiencia que pide el JD?", en: "Does he meet the years of experience in the JD?" },
];

export function AgentHiring() {
  const { tl } = useI18n();
  const fileInput = useRef<HTMLInputElement>(null);
  const [markdown, setMarkdown] = useState("");
  const [fileName, setFileName] = useState("");
  const [index, setIndex] = useState<Awaited<ReturnType<typeof createRecruiterIndex>> | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [question, setQuestion] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function uploadJobDescription(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    await processJobDescription(file);
    event.target.value = "";
  }

  function dropJobDescription(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (!busy && file) void processJobDescription(file);
  }

  async function processJobDescription(file: File) {
    setBusy(true);
    setError("");
    setStatus(tl({ es: "Convirtiendo el documento a Markdown…", en: "Converting the document to Markdown…" }));
    setIndex(null);
    setMessages([]);

    try {
      const converted = await jobDescriptionToMarkdown(file);
      setMarkdown(converted);
      setFileName(file.name);
      setStatus(tl({ es: "Preparando la búsqueda local…", en: "Preparing local search…" }));
      const loadedIndex = await createRecruiterIndex(converted, setStatus);
      setIndex(loadedIndex);
      setMessages([{
        role: "portfolio",
        text: tl({
          es: `Leí ${file.name} y preparé la búsqueda con EmbeddingGemma 2. Preguntame por la experiencia o por qué requisitos puedo demostrar.`,
          en: `I read ${file.name} and prepared search with EmbeddingGemma 2. Ask me about experience or which requirements I can support with evidence.`,
        }),
      }]);
    } catch (cause) {
      setMarkdown("");
      setFileName("");
      setStatus("");
      const reason = cause instanceof Error ? cause.message : "";
      setError(/failed to fetch|network|cors/i.test(reason)
        ? tl({ es: "No pude descargar el modelo desde Hugging Face. Revisá la conexión y volvé a intentarlo.", en: "I couldn't download the model from Hugging Face. Check the connection and try again." })
        : reason || tl({ es: "No pude procesar el documento.", en: "I couldn't process the document." }));
    } finally {
      setBusy(false);
    }
  }

  async function answerQuestion(value: string) {
    const text = value.trim();
    if (!index || !text || busy) return;

    setQuestion("");
    setError("");
    setMessages((current) => [...current, { role: "recruiter", text }]);
    setBusy(true);
    setStatus(tl({ es: "Buscando evidencia en el portfolio…", en: "Searching portfolio evidence…" }));
    try {
      const vector = await embedQuestion(index, text);
      const evidence = rankEvidence(index, vector);
      const relatedRequirements = rankRequirements(index);
      const yearsRequired = findMinimumYears(markdown);
      const asksForFit = /\b(adecuad|encaj|contrat|candidat|match|fit|hire|suitab)\w*/i.test(text);
      const asksAboutRequirements = /\b(requisit|requirement|año|años|year|years)\w*/i.test(text);
      const answer = buildAnswer({
        evidence,
        relatedRequirements,
        yearsRequired: asksForFit || asksAboutRequirements ? yearsRequired : null,
        asksForFit,
        language: /\b(the|what|does|years|experience|role|candidate)\b/i.test(text) ? "en" : "es",
      });
      setMessages((current) => [...current, { role: "portfolio", text: answer, sources: evidence }]);
      setStatus(tl({ es: `Búsqueda local lista · ${index.embedder.device === "webgpu" ? "WebGPU" : "procesador"}`, en: `Local search ready · ${index.embedder.device === "webgpu" ? "WebGPU" : "CPU"}` }));
    } catch {
      setError(tl({ es: "Falló la búsqueda local. Probá otra vez o usá WebGPU en un navegador compatible.", en: "Local search failed. Try again or use WebGPU in a compatible browser." }));
      setStatus("");
    } finally {
      setBusy(false);
    }
  }

  function ask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void answerQuestion(question);
  }

  return (
    <main className="section recruiter" id="for-recruiters">
      <div className="wrap recruiter-wrap">
        <Link href="/#contact" className="link-underline recruiter-back">
          {tl({ es: "← Volver a contacto", en: "← Back to contact" })}
        </Link>

        <header className="recruiter-heading">
          <span className="eyebrow">{tl({ es: "UN PERFIL · EVIDENCIA ABIERTA", en: "ONE PROFILE · OPEN EVIDENCE" })}</span>
          <h1 className="h-display">{tl({ es: "¿Este puesto es un buen match?", en: "Could this role be a good match?" })}</h1>
          <p>{tl({ es: "Compará los requisitos del puesto con mi experiencia real. Encontrá coincidencias, brechas y lo que todavía no puedo demostrar.", en: "Compare the role's requirements with my actual experience. See the matches, gaps, and what I can't substantiate yet." })}</p>
        </header>

        <section className="glass recruiter-card" aria-label={tl({ es: "Evaluación local del puesto", en: "Local role review" })}>
          {!index ? (
            <div className="recruiter-upload">
              <div className="recruiter-upload-topline">
                <span className="recruiter-step">01 / {tl({ es: "DESCRIPCIÓN DEL PUESTO", en: "JOB DESCRIPTION" })}</span>
                <span className="recruiter-local-badge"><span aria-hidden="true">●</span> {tl({ es: "ANÁLISIS LOCAL", en: "LOCAL ANALYSIS" })}</span>
              </div>
              <h2>{tl({ es: "Traé el puesto. Revisemos la evidencia.", en: "Bring the role. Let's check the evidence." })}</h2>
              <p>{tl({ es: "Subí un JD en PDF o DOCX. Lo leo y busco evidencia en mi portfolio directamente en tu navegador.", en: "Upload a job description as PDF or DOCX. I read it and search my portfolio for evidence right in your browser." })}</p>
              <input
                ref={fileInput}
                className="recruiter-file-input"
                type="file"
                accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                aria-label={tl({ es: "Subir descripción del puesto en PDF o DOCX", en: "Upload job description as PDF or DOCX" })}
                onChange={uploadJobDescription}
                disabled={busy}
              />
              <div className="recruiter-dropzone" onDrop={dropJobDescription} onDragOver={(event) => event.preventDefault()}>
                <span className="recruiter-upload-icon" aria-hidden="true">↑</span>
                <p>{tl({ es: "Arrastrá el archivo acá", en: "Drop your file here" })}<span>{tl({ es: " o ", en: " or " })}</span></p>
                <button className="btn-cosmic-primary" type="button" onClick={() => fileInput.current?.click()} disabled={busy}>
                  {busy ? tl({ es: "Preparando análisis…", en: "Preparing review…" }) : tl({ es: "Elegir PDF o DOCX →", en: "Choose PDF or DOCX →" })}
                </button>
              </div>
              <div className="recruiter-local-note">
                <span className="recruiter-local-mark" aria-hidden="true">↳</span>
                <p className="recruiter-note">{tl({ es: "El JD y tus preguntas se procesan en este navegador; no se envían a mi servidor. La primera vez se descarga EmbeddingGemma 2 (~175 MB) desde Hugging Face y queda en caché para próximas visitas.", en: "Your job description and questions stay in this browser; they aren't sent to my server. The first visit downloads EmbeddingGemma 2 (~175 MB) from Hugging Face and caches it for next time." })}</p>
              </div>
            </div>
          ) : (
            <>
              <div className="recruiter-chat-header">
                <div>
                  <span className="recruiter-step">02 · CHAT LOCAL</span>
                  <h2>{fileName}</h2>
                </div>
                <button className="recruiter-change-file" type="button" onClick={() => fileInput.current?.click()} disabled={busy}>
                  {tl({ es: "Cambiar JD", en: "Change JD" })}
                </button>
                <input ref={fileInput} className="recruiter-file-input" type="file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" aria-label={tl({ es: "Cambiar JD", en: "Change JD" })} onChange={uploadJobDescription} disabled={busy} />
              </div>
              <div className="recruiter-messages" aria-live="polite" aria-label={tl({ es: "Conversación", en: "Conversation" })}>
                {messages.map((message, messageIndex) => (
                  <article className={`recruiter-message ${message.role}`} key={`${message.role}-${messageIndex}`}>
                    <span>{message.role === "recruiter" ? tl({ es: "RECLUTADOR", en: "RECRUITER" }) : "FRANCISCO · PORTFOLIO"}</span>
                    <p>{message.text}</p>
                    {message.sources?.map((source) => (
                      <details className="recruiter-source" key={source.title}>
                        <summary>{source.title}</summary>
                        <p>{source.text}</p>
                      </details>
                    ))}
                  </article>
                ))}
              </div>
              <div className="recruiter-prompts">
                {PROMPTS.map((prompt) => (
                  <button key={prompt.es} type="button" onClick={() => void answerQuestion(tl(prompt))} disabled={busy}>
                    {tl(prompt)}
                  </button>
                ))}
              </div>
              <form className="recruiter-form" onSubmit={ask}>
                <label className="sr-only" htmlFor="recruiter-question">{tl({ es: "Tu pregunta", en: "Your question" })}</label>
                <textarea
                  id="recruiter-question"
                  rows={2}
                  maxLength={500}
                  value={question}
                  onChange={(event) => setQuestion(event.target.value)}
                  placeholder={tl({ es: "Preguntá por experiencia, tecnologías o requisitos…", en: "Ask about experience, technologies or requirements…" })}
                  disabled={busy}
                />
                <button className="btn-cosmic-primary" type="submit" disabled={busy || !question.trim()}>
                  {tl({ es: "Preguntar →", en: "Ask →" })}
                </button>
              </form>
              <details className="recruiter-markdown">
                <summary>{tl({ es: "Ver JD convertido a Markdown", en: "View JD converted to Markdown" })}</summary>
                <pre>{markdown}</pre>
              </details>
            </>
          )}

          <p className="recruiter-status" role="status" aria-live="polite">{status}</p>
          {error && <p className="recruiter-error" role="alert">{error}</p>}
          <footer className="recruiter-disclosure">
            <p>{tl({ es: "EmbeddingGemma 2 solo recupera fragmentos relacionados; no genera texto ni decide contrataciones. La respuesta muestra el origen para que puedas verificarlo. Los años y otros requisitos explícitos se contrastan con lo declarado en el portfolio.", en: "EmbeddingGemma 2 only retrieves related passages; it does not generate text or make hiring decisions. Answers include their source so you can verify them. Explicit requirements such as years are compared with what the portfolio states." })}</p>
            <p>{tl({ es: "Para avanzar, escribime:", en: "To move forward, contact me:" })} <a className="link-underline" href={`mailto:${CV.email}`}>{CV.email}</a></p>
          </footer>
        </section>
      </div>
    </main>
  );
}

function findMinimumYears(markdown: string): number | null {
  const numberWords: Record<string, number> = {
    one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
    un: 1, uno: 1, una: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7, ocho: 8, nueve: 9, diez: 10,
  };
  const matches = [...markdown.matchAll(/\b(\d{1,2}|one|two|three|four|five|six|seven|eight|nine|ten|un|uno|una|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez)\s*\+?\s*(?:years?|años?)\b/gi)];
  const years = matches.map((match) => Number(match[1]) || numberWords[match[1].toLowerCase()]).filter(Number.isFinite);
  return years.length ? Math.max(...years) : null;
}

function buildAnswer({
  evidence,
  relatedRequirements,
  yearsRequired,
  asksForFit,
  language,
}: {
  evidence: ReturnType<typeof rankEvidence>;
  relatedRequirements: ReturnType<typeof rankRequirements>;
  yearsRequired: number | null;
  asksForFit: boolean;
  language: "es" | "en";
}) {
  const lead = language === "es"
    ? "La búsqueda semántica encontró estos fragmentos del portfolio relacionados con tu pregunta:"
    : "Semantic search found these portfolio passages related to your question:";
  const relevantJD = language === "es" ? "Partes del JD cercanas a esa evidencia:" : "JD passages closest to that evidence:";
  const yearsNote = yearsRequired
    ? language === "es"
      ? yearsRequired > 3
        ? `El JD pide ${yearsRequired} años. El portfolio declara casi 3 años de experiencia en industria; no demuestra ese mínimo y la brecha aproximada es de ${yearsRequired - 3} años.`
        : `El JD pide ${yearsRequired} años. El portfolio declara casi 3 años de experiencia en industria, aunque no detalla fechas suficientes para verificar ese mínimo con precisión.`
      : yearsRequired > 3
        ? `The JD asks for ${yearsRequired} years. The portfolio states nearly 3 years of industry experience; it does not substantiate that minimum, with an approximate gap of ${yearsRequired - 3} years.`
        : `The JD asks for ${yearsRequired} years. The portfolio states nearly 3 years of industry experience, but does not provide enough exact dates to verify the minimum precisely.`
    : "";
  const fitNote = asksForFit
    ? yearsRequired && yearsRequired > 3
      ? language === "es"
        ? "Evaluación provisional: si ese mínimo es excluyente, el portfolio no demuestra que Francisco lo cumpla y no lo marcaría como match completo."
        : "Provisional assessment: if that minimum is mandatory, the portfolio does not show that Francisco meets it, so I wouldn't mark him as a complete match."
      : language === "es"
        ? "No puedo dar un sí/no general con embeddings. Los fragmentos son evidencia relacionada; confirmá los requisitos excluyentes y las fechas antes de decidir."
        : "I can't give a general yes/no from embeddings. These passages are related evidence; verify mandatory requirements and dates before deciding."
    : "";
  const limitation = language === "es"
    ? "Esto es recuperación semántica, no un puntaje de compatibilidad ni una decisión de contratación. Una coincidencia no prueba por sí sola que se cumpla un requisito; verificá cada fuente."
    : "This is semantic retrieval, not a fit score or hiring decision. A related passage alone does not prove a requirement is met; verify each source.";
  const evidenceText = evidence.length
    ? evidence.map((item) => `• ${item.title}: ${item.text.slice(0, 360)}`).join("\n")
    : language === "es" ? "No encontré evidencia en el portfolio para esta pregunta." : "I couldn't find portfolio evidence for this question.";
  const requirementText = relatedRequirements.slice(0, 2).map((item) => `• ${item.text.replace(/\s+/g, " ").slice(0, 180)}\n  Evidencia recuperada: ${item.evidence.title} — ${item.evidence.text.slice(0, 240)}`).join("\n");
  return [lead, evidenceText, requirementText ? `${relevantJD}\n${requirementText}` : "", yearsNote, fitNote, limitation].filter(Boolean).join("\n\n");
}
