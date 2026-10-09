"use client";

import { useRef, useState, type ChangeEvent, type DragEvent, type FormEvent } from "react";
import Link from "next/link";
import { CV } from "@/data/cv";
import { useI18n } from "@/lib/i18n";
import {
  createRecruiterIndex,
  describeYearsEvidence,
  embedQuestion,
  extractRequiredYears,
  jobDescriptionToMarkdown,
  rankEvidence,
  rankRequirements,
  type Evidence,
} from "@/lib/recruiter-search";
import { generateRecruiterAnswer } from "@/lib/recruiter-answer";

interface ChatMessage {
  role: "recruiter" | "portfolio";
  text: string;
  sources?: Evidence[];
  requirements?: string[];
}
const PROMPTS = [
  { es: "¿Francisco es adecuado para este puesto?", en: "Is Francisco a good fit for this role?" },
  { es: "¿Qué experiencia tiene con IA y RAG?", en: "What experience does he have with AI and RAG?" },
  { es: "¿Cumple los años de experiencia que pide el JD?", en: "Does he meet the years of experience in the JD?" },
];

export function AgentHiring() {
  const { lang, tl } = useI18n();
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
      const loadedIndex = await createRecruiterIndex(converted, setStatus, lang);
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
      const relatedRequirements = rankRequirements(index, vector);
      const asksForFit = /\b(adecuad|encaj|contrat|candidat|match|fit|hire|suitab)\w*/i.test(text);
      const asksAboutRequirements = /\b(requisit|requirement|año|años|year|years)\w*/i.test(text);
      const language = lang;
      const yearsAssessment = asksForFit || asksAboutRequirements
        ? describeYearsEvidence(extractRequiredYears(markdown), language)
        : undefined;
      const response = await generateRecruiterAnswer({
        evidence,
        language,
        question: text,
        onProgress: setStatus,
      });
      setMessages((current) => [...current, {
        role: "portfolio",
        text: [response.text, yearsAssessment].filter(Boolean).join("\n\n"),
        sources: evidence,
        requirements: relatedRequirements.slice(0, 2).map((item) => item.text),
      }]);
      setStatus(response.device
        ? tl({ es: `Respuesta local lista · Embeddings ${index.embedder.device === "webgpu" ? "WebGPU" : "CPU"} · sLLM ${response.device === "webgpu" ? "WebGPU" : "CPU"}`, en: `Local answer ready · Embeddings ${index.embedder.device === "webgpu" ? "WebGPU" : "CPU"} · sLLM ${response.device === "webgpu" ? "WebGPU" : "CPU"}` })
        : tl({ es: "Respuesta de respaldo · evidencia local", en: "Fallback answer · local evidence" }));
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
                <p className="recruiter-note">{tl({ es: "El JD y tus preguntas se procesan en este navegador; no se envían a mi servidor. Al cargar el JD se descarga EmbeddingGemma 2 (~175 MB). La primera pregunta descarga Qwen 0.5B (~500 MB); ambos modelos quedan en caché.", en: "Your job description and questions stay in this browser; they aren't sent to my server. Uploading the JD downloads EmbeddingGemma 2 (~175 MB). Your first question downloads Qwen 0.5B (~500 MB); both models are cached." })}</p>
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
                    <span>{message.role === "recruiter" ? tl({ es: "RECLUTADOR", en: "RECRUITER" }) : tl({ es: "ASISTENTE LOCAL · PORTFOLIO", en: "LOCAL ASSISTANT · PORTFOLIO" })}</span>
                    <p>{message.text}</p>
                    {message.requirements?.map((requirement, requirementIndex) => (
                      <details className="recruiter-source" key={requirementIndex}>
                        <summary>R{requirementIndex + 1} · {tl({ es: "Fragmento del JD más cercano", en: "Closest JD passage" })}</summary>
                        <p>{requirement}</p>
                      </details>
                    ))}
                    {message.sources?.map((source) => (
                      <details className="recruiter-source" key={source.title}>
                        <summary>E{(message.sources?.indexOf(source) ?? -1) + 1} · {source.title}</summary>
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
            <p>{tl({ es: "EmbeddingGemma 2 recupera evidencia y un sLLM local selecciona los fragmentos más relevantes. La respuesta reproduce esos fragmentos literalmente; no decide contrataciones. Verificá cada afirmación en sus fuentes. Los años se contrastan con lo declarado en el portfolio y se marcan como no demostrados cuando falta evidencia.", en: "EmbeddingGemma 2 retrieves evidence and a local sLLM selects the most relevant passages. Answers reproduce those passages verbatim; the model does not make hiring decisions. Verify each claim against its sources. Years are compared with the portfolio and marked as unsubstantiated when evidence is missing." })}</p>
            <p>{tl({ es: "Para avanzar, escribime:", en: "To move forward, contact me:" })} <a className="link-underline" href={`mailto:${CV.email}`}>{CV.email}</a></p>
          </footer>
        </section>
      </div>
    </main>
  );
}
