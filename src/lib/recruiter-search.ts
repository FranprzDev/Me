import { CV } from "@/data/cv";
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

export function portfolioEvidence(): Evidence[] {
  return [
    { title: "Perfil", text: CV.summary.es },
    ...CV.experience.map((item) => ({
      title: `${item.role.es} · ${item.org} · ${item.period.es}`,
      text: `${item.description.es} Tecnologías: ${item.stack?.join(", ") ?? ""}`,
    })),
    ...CV.highlights.map((item) => ({
      title: `${item.title} · ${item.year}`,
      text: item.detail.es,
    })),
    ...CV.education.map((item) => ({
      title: item.institution,
      text: `${item.degree.es} · ${item.period.es}`,
    })),
    ...CV.certifications.map((item) => ({
      title: `${item.name.es} · ${item.school}`,
      text: `${item.period.es}${item.highlight ? ` · ${item.highlight.es}` : ""}`,
    })),
    ...PROJECTS.flatMap((project) => [
      { title: project.title?.es ?? project.name, text: `${project.tagline.es} ${project.description.es} Stack: ${project.stack.join(", ")}` },
      ...(project.items ?? []).map((item) => ({
        title: `${item.name} · ${project.name}`,
        text: `${item.description.es}${item.highlight ? ` ${item.highlight.es}` : ""}`,
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

export async function createRecruiterIndex(markdown: string, onProgress: (message: string) => void) {
  const embedder = await getEmbedder(onProgress);
  const evidence = portfolioEvidence();
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

export function rankRequirements(index: Awaited<ReturnType<typeof createRecruiterIndex>>) {
  return index.requirements
    .map((text, requirementIndex) => ({
      text,
      evidence: rankVector(index, index.requirementVectors[requirementIndex]),
    }))
    .sort((left, right) => right.evidence.relevance - left.evidence.relevance)
    .slice(0, 4);
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
