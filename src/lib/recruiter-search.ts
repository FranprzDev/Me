import { CV, type Lang } from "@/data/cv";
import { PROJECTS } from "@/data/projects";

const MODEL_ID = "onnx-community/embeddinggemma-2-ONNX";
const MAX_FILE_BYTES = 10 * 1024 * 1024;
const MAX_TEXT_LENGTH = 60_000;

export interface Evidence {
  title: string;
  text: string;
}

interface Embedder {
  embed: (texts: string[], prefix: "query" | "document") => Promise<number[][]>;
  device: "webgpu" | "wasm";
}

let embedderPromise: Promise<Embedder> | undefined;

export function portfolioEvidence(language: Lang): Evidence[] {
  return [
    { title: language === "es" ? "Perfil" : "Profile", text: CV.summary[language] },
    ...CV.experience.map((item) => ({
      title: `${item.role[language]} · ${item.org} · ${item.period[language]}`,
      text: `${item.description[language]} ${language === "es" ? "Tecnologías" : "Technologies"}: ${item.stack?.join(", ") ?? ""}`,
    })),
    ...CV.highlights.map((item) => ({
      title: `${item.title} · ${item.year}`,
      text: item.detail[language],
    })),
    ...CV.education.map((item) => ({
      title: item.institution,
      text: `${item.degree[language]} · ${item.period[language]}`,
    })),
    ...CV.certifications.map((item) => ({
      title: `${item.name[language]} · ${item.school}`,
      text: `${item.period[language]}${item.highlight ? ` · ${item.highlight[language]}` : ""}`,
    })),
    ...PROJECTS.flatMap((project) => [
      { title: project.title?.[language] ?? project.name, text: `${project.tagline[language]} ${project.description[language]} Stack: ${project.stack.join(", ")}` },
      ...(project.items ?? []).map((item) => ({
        title: `${item.name} · ${project.name}`,
        text: `${item.description[language]}${item.highlight ? ` ${item.highlight[language]}` : ""}`,
      })),
    ]),
  ];
}

export async function jobDescriptionToMarkdown(file: File): Promise<string> {
  if (file.size > MAX_FILE_BYTES) throw new Error("El archivo supera el máximo de 10 MB.");
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (extension !== "pdf" && extension !== "docx") throw new Error("Subí un archivo PDF o DOCX.");

  let markdown: string;
  if (extension === "docx") {
    const mammoth = (await import("mammoth")).default;
    const result = await mammoth.convertToHtml({ arrayBuffer: await file.arrayBuffer() });
    const document = new DOMParser().parseFromString(result.value, "text/html");
    markdown = Array.from(document.body.children).map((element) => {
      const text = element.textContent?.trim() ?? "";
      const heading = /^H([1-6])$/.exec(element.tagName);
      if (heading) return `${"#".repeat(Number(heading[1]))} ${text}`;
      if (element.tagName === "UL" || element.tagName === "OL") {
        return Array.from(element.children).map((item, index) => `${element.tagName === "OL" ? `${index + 1}.` : "-"} ${item.textContent?.trim() ?? ""}`).join("\n");
      }
      return text;
    }).filter(Boolean).join("\n\n");
  } else {
    const pdfjs = await import("pdfjs-dist");
    pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
    const document = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
    if (document.numPages > 80) throw new Error("El PDF supera el máximo de 80 páginas.");

    const pages: string[] = [];
    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
      const page = await document.getPage(pageNumber);
      const content = await page.getTextContent();
      let pageText = "";
      for (const item of content.items) {
        if ("str" in item && item.str.trim()) pageText += `${item.str.trim()}${item.hasEOL ? "\n" : " "}`;
      }
      pages.push(pageText.trim());
    }
    markdown = pages.map((page, index) => `## Página ${index + 1}\n\n${page}`).join("\n\n");
  }

  const normalized = markdown.replace(/\n{3,}/g, "\n\n").trim();
  if (normalized.length > MAX_TEXT_LENGTH) throw new Error("La descripción del puesto supera el máximo de 60.000 caracteres extraídos.");
  if (normalized.length < 80) {
    throw new Error("No encontré suficiente texto. Si el PDF es un escaneo, necesitás un PDF con texto seleccionable.");
  }
  return `# Descripción del puesto: ${file.name}\n\n${normalized}`;
}

export function chunkMarkdown(markdown: string, maxLength = 900): string[] {
  const paragraphs = markdown.split(/\n\s*\n/).map((part) => part.trim()).filter(Boolean);
  const chunks: string[] = [];
  let current = "";

  for (const paragraph of paragraphs) {
    if (paragraph.length > maxLength) {
      if (current) chunks.push(current);
      current = "";
      for (let offset = 0; offset < paragraph.length; offset += maxLength) {
        chunks.push(paragraph.slice(offset, offset + maxLength));
      }
      continue;
    }
    if (current && current.length + paragraph.length + 2 > maxLength) {
      chunks.push(current);
      current = "";
    }
    current = current ? `${current}\n\n${paragraph}` : paragraph;
  }
  if (current) chunks.push(current);
  return chunks;
}

export async function createRecruiterIndex(markdown: string, onProgress: (message: string) => void, language: Lang) {
  const embedder = await getEmbedder(onProgress);
  const evidence = portfolioEvidence(language);
  const requirements = chunkMarkdown(markdown);
  onProgress("Indexando experiencia pública del portfolio…");
  const evidenceVectors = await embedder.embed(evidence.map((item) => `title: ${item.title} | text: ${item.text}`), "document");
  onProgress("Indexando requisitos del JD…");
  const requirementVectors = await embedder.embed(requirements, "query");
  return { evidence, evidenceVectors, requirements, requirementVectors, embedder };
}

export async function embedQuestion(index: Awaited<ReturnType<typeof createRecruiterIndex>>, question: string) {
  return index.embedder.embed([question], "query").then(([vector]) => vector);
}

export function rankEvidence(index: Awaited<ReturnType<typeof createRecruiterIndex>>, vector: number[]) {
  return index.evidence
    .map((item, position) => ({ ...item, relevance: cosine(vector, index.evidenceVectors[position]) }))
    .sort((left, right) => right.relevance - left.relevance)
    .slice(0, 3);
}

export function rankRequirements(index: Awaited<ReturnType<typeof createRecruiterIndex>>, vector: number[]) {
  return index.requirements
    .map((text, requirementIndex) => ({
      text,
      relevance: cosine(vector, index.requirementVectors[requirementIndex]),
      evidence: rankVector(index, index.requirementVectors[requirementIndex]),
    }))
    .sort((left, right) => right.relevance - left.relevance)
    .slice(0, 4);
}

export function extractRequiredYears(markdown: string): number | null {
  const numberWords: Record<string, number> = {
    one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
    un: 1, uno: 1, una: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7, ocho: 8, nueve: 9, diez: 10,
  };
  const matches = [...markdown.matchAll(/\b(\d{1,2}|one|two|three|four|five|six|seven|eight|nine|ten|un|uno|una|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez)\s*\+?\s*(?:years?|años?)\s*(?:(?:of|de)\s+)?(?:(?:professional|industry|relevant|ai|software|profesional|industrial|relevante)\s+)?(?:experience|experiencia)\b/gi)];
  const years = matches.map((match) => Number(match[1]) || numberWords[match[1].toLowerCase()]).filter(Number.isFinite);
  return years.length ? Math.max(...years) : null;
}

export function describeYearsEvidence(requiredYears: number | null, language: "es" | "en") {
  if (requiredYears === null) {
    return language === "es"
      ? "No detecté un mínimo explícito de años en el JD; no lo doy por cumplido."
      : "I couldn't detect an explicit minimum number of years in the JD, so I can't mark it as met.";
  }

  if (requiredYears > 3) {
    return language === "es"
      ? `El JD pide ${requiredYears} años. El perfil declara casi 3 años en industria, así que el portfolio no demuestra ese mínimo.`
      : `The JD asks for ${requiredYears} years. The profile states nearly 3 years in industry, so the portfolio does not substantiate that minimum.`;
  }

  return language === "es"
    ? `El JD pide ${requiredYears} años. El perfil declara casi 3 años en industria, pero no incluye fechas suficientes para verificar con precisión ese mínimo.`
    : `The JD asks for ${requiredYears} years. The profile states nearly 3 years in industry, but does not provide enough dates to verify that minimum precisely.`;
}

function rankVector(index: Awaited<ReturnType<typeof createRecruiterIndex>>, vector: number[]) {
  return index.evidence
    .map((item, position) => ({ ...item, relevance: cosine(vector, index.evidenceVectors[position]) }))
    .sort((left, right) => right.relevance - left.relevance)[0];
}

async function getEmbedder(onProgress: (message: string) => void): Promise<Embedder> {
  if (!embedderPromise) embedderPromise = initializeEmbedder(onProgress);
  try {
    return await embedderPromise;
  } catch (error) {
    embedderPromise = undefined;
    throw error;
  }
}

async function initializeEmbedder(onProgress: (message: string) => void): Promise<Embedder> {
  const { AutoConfig, AutoModel, AutoTokenizer } = await import("@huggingface/transformers");
  const config = await AutoConfig.from_pretrained(MODEL_ID, {
    progress_callback: (progress) => {
      if (progress.status === "progress" && progress.total) {
        onProgress(`Descargando EmbeddingGemma 2: ${Math.round((progress.loaded / progress.total) * 100)}%`);
      }
    },
  });
  Object.assign(config, { vision_config: null, audio_config: null });

  const tokenizer = await AutoTokenizer.from_pretrained(MODEL_ID);
  const canUseWebGPU = typeof navigator !== "undefined" && "gpu" in navigator;
  const devices = canUseWebGPU ? ["webgpu", "wasm"] as const : ["wasm"] as const;
  let lastError: unknown;

  for (const device of devices) {
    try {
      onProgress(device === "webgpu" ? "Cargando EmbeddingGemma 2 con WebGPU…" : "Cargando EmbeddingGemma 2 con el procesador…");
      const model = await AutoModel.from_pretrained(MODEL_ID, {
        config,
        device,
        dtype: "q4",
        progress_callback: (progress) => {
          if (progress.status === "progress" && progress.total) {
            onProgress(`Descargando EmbeddingGemma 2: ${Math.round((progress.loaded / progress.total) * 100)}%`);
          }
        },
      });
      const embed = async (texts: string[], prefix: "query" | "document") => {
        const vectors: number[][] = [];
        for (let offset = 0; offset < texts.length; offset += 8) {
          onProgress(`Calculando embeddings ${Math.min(offset + 8, texts.length)}/${texts.length}…`);
          const batch = texts.slice(offset, offset + 8).map((text) => prefix === "query"
            ? `task: search result | query: ${text}`
            : text);
          const output = await model(await tokenizer(batch, { padding: true, truncation: true }));
          const tensor = output.sentence_embedding;
          if (!tensor || typeof tensor.tolist !== "function") throw new Error("EmbeddingGemma 2 no devolvió embeddings.");
          const width = tensor.dims.at(-1);
          if (!width) throw new Error("La dimensión del embedding no es válida.");
          const rows: unknown = tensor.tolist();
          if (!Array.isArray(rows)) throw new Error("EmbeddingGemma 2 devolvió un formato inválido.");
          for (let row = 0; row < batch.length; row += 1) {
            const values: unknown = rows[row];
            if (!Array.isArray(values) || values.length !== width || !values.every((value) => typeof value === "number")) {
              throw new Error("EmbeddingGemma 2 devolvió un vector inválido.");
            }
            vectors.push(normalize(values));
          }
        }
        return vectors;
      };
      await embed(["prueba de inicialización"], "query");
      onProgress(device === "webgpu" ? "Modelo listo · WebGPU" : "Modelo listo · procesador");
      return { embed, device };
    } catch (error) {
      lastError = error;
      if (device === "webgpu") onProgress("WebGPU no pudo iniciar; probando modo compatible…");
    }
  }
  throw lastError instanceof Error ? lastError : new Error("No se pudo iniciar EmbeddingGemma 2 en este navegador.");
}

function normalize(vector: number[]) {
  const norm = Math.sqrt(vector.reduce((total, value) => total + value * value, 0));
  return norm ? vector.map((value) => value / norm) : vector;
}

function cosine(left: number[], right: number[]) {
  return left.reduce((total, value, index) => total + value * (right[index] ?? 0), 0);
}
