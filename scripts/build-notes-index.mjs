/**
 * Construye el índice de apuntes UTN-FRT.
 *
 * Recorre /notes/<nivel>/<materia>/<archivos>, parsea:
 *   - .md            -> frontmatter (gray-matter) + cuerpo completo (texto)
 *   - .pdf/.docx/
 *     .xlsx/.pptx    -> extracción de texto con officeparser (CORE de la búsqueda)
 *   - .jpg/.png      -> solo metadata (desde sidecar .meta.json si existe)
 *
 * Salida:
 *   - src/data/notes-index.json   (consumido por el MCP y la UI)
 *   - public/notes/...            (copia de binarios para servirlos por URL)
 *
 * El texto se extrae UNA vez acá (en build) -> costo $0 en runtime.
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";
import { parseOffice } from "officeparser";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const NOTES_DIR = path.join(ROOT, "notes");
const OUT_JSON = path.join(ROOT, "src", "data", "notes-index.json");
const PUBLIC_NOTES = path.join(ROOT, "public", "notes");

const LEVEL_LABELS = {
  "1er-nivel": "1er Nivel (Primer Año)",
  "2do-nivel": "2do Nivel (Segundo Año)",
  "3er-nivel": "3er Nivel (Tercer Año)",
  "4to-nivel": "4to Nivel (Cuarto Año)",
  "5to-nivel": "5to Nivel (Quinto Año)",
};

const OFFICE_EXT = new Set([".pdf", ".docx", ".xlsx", ".pptx"]);
const IMAGE_EXT = new Set([".jpg", ".jpeg", ".png"]);

function typeFromExt(ext) {
  if (ext === ".md") return "md";
  if (ext === ".pdf") return "pdf";
  if (ext === ".docx") return "docx";
  if (ext === ".xlsx") return "xlsx";
  if (ext === ".pptx") return "pptx";
  if (ext === ".jpg" || ext === ".jpeg") return "jpg";
  if (ext === ".png") return "png";
  return "other";
}

function titleize(slug) {
  return slug
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

async function exists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function readDirs(dir) {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    return entries.filter((e) => e.isDirectory()).map((e) => e.name);
  } catch {
    return [];
  }
}

async function readFiles(dir) {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    return entries.filter((e) => e.isFile()).map((e) => e.name);
  } catch {
    return [];
  }
}

async function extractText(filePath, ext) {
  try {
    if (OFFICE_EXT.has(ext)) {
      const ast = await parseOffice(filePath);
      const text = typeof ast?.toText === "function" ? ast.toText() : String(ast ?? "");
      return (text || "").replace(/\s+/g, " ").trim();
    }
  } catch (err) {
    console.warn(`  ! No se pudo extraer texto de ${path.basename(filePath)}: ${err.message}`);
    return null;
  }
  return "";
}

async function readSidecarMeta(filePath) {
  const metaPath = `${filePath}.meta.json`;
  if (await exists(metaPath)) {
    try {
      return JSON.parse(await fs.readFile(metaPath, "utf8"));
    } catch {
      /* ignore */
    }
  }
  return {};
}

async function main() {
  const levels = [];
  const subjects = [];
  const notes = [];
  const seenIds = new Set();
  let extractFailures = 0;

  // Garantiza ids únicos (ej. parcial.pdf y parcial.docx en la misma materia).
  const uniqueId = (base, type) => {
    let id = base;
    if (seenIds.has(id)) id = `${base}-${type}`;
    let n = 2;
    while (seenIds.has(id)) id = `${base}-${type}-${n++}`;
    seenIds.add(id);
    return id;
  };

  const levelDirs = (await readDirs(NOTES_DIR)).sort();

  for (const levelId of levelDirs) {
    const levelLabel = LEVEL_LABELS[levelId] || titleize(levelId);
    const levelPath = path.join(NOTES_DIR, levelId);
    const subjectDirs = (await readDirs(levelPath)).sort();
    const levelSubjects = [];

    for (const subjectId of subjectDirs) {
      const subjectPath = path.join(levelPath, subjectId);
      const files = await readFiles(subjectPath);
      let subjectName = titleize(subjectId);
      const subjectFiles = [];

      for (const fileName of files) {
        if (fileName.endsWith(".meta.json")) continue;
        const ext = path.extname(fileName).toLowerCase();
        const type = typeFromExt(ext);
        if (type === "other") continue;

        const filePath = path.join(subjectPath, fileName);
        const fileSlug = fileName.slice(0, -ext.length);
        const id = uniqueId(`${levelId}/${subjectId}/${fileSlug}`, type);

        let title = titleize(fileSlug);
        let tags = ["utn-frt", "ing-sistemas"];
        let updated = null;
        let status = "disponible";
        let content = null; // texto inline (solo .md)
        let text = ""; // texto para búsqueda
        let url = null;
        let description = "";

        if (type === "md") {
          const raw = await fs.readFile(filePath, "utf8");
          const parsed = matter(raw);
          const fm = parsed.data || {};
          title = fm.title || title;
          if (fm.subject) subjectName = fm.subject;
          if (Array.isArray(fm.tags)) tags = fm.tags;
          updated = fm.updated || null;
          status = fm.status || status;
          content = parsed.content.trim();
          text = content;
        } else {
          // binario: metadata por sidecar + texto extraído (office) o solo metadata (imágenes)
          const meta = await readSidecarMeta(filePath);
          title = meta.title || title;
          if (meta.subject) subjectName = meta.subject;
          if (Array.isArray(meta.tags)) tags = meta.tags;
          updated = meta.updated || null;
          description = meta.description || "";

          // copiar binario a /public/notes para servirlo por URL
          const destDir = path.join(PUBLIC_NOTES, levelId, subjectId);
          await fs.mkdir(destDir, { recursive: true });
          await fs.copyFile(filePath, path.join(destDir, fileName));
          url = `/notes/${encodeURIComponent(levelId)}/${encodeURIComponent(
            subjectId
          )}/${encodeURIComponent(fileName)}`;

          if (IMAGE_EXT.has(ext)) {
            text = [title, description].filter(Boolean).join(" ");
          } else {
            const extracted = await extractText(filePath, ext);
            if (extracted === null) extractFailures++;
            text = [title, description, extracted].filter(Boolean).join(" ");
          }
        }

        const note = {
          id,
          title,
          level: levelId,
          levelLabel,
          subject: subjectName,
          subjectId,
          type,
          tags,
          updated,
          status,
          fileName,
          url,
          description,
          content, // string | null
          text, // searchable
        };
        notes.push(note);
        subjectFiles.push(note);
      }

      const subject = {
        id: `${levelId}/${subjectId}`,
        subjectId,
        name: subjectName,
        level: levelId,
        levelLabel,
        fileCount: subjectFiles.length,
        files: subjectFiles.map((f) => ({
          id: f.id,
          title: f.title,
          type: f.type,
          status: f.status,
        })),
      };
      subjects.push(subject);
      levelSubjects.push({
        id: subject.id,
        subjectId,
        name: subjectName,
        fileCount: subjectFiles.length,
      });
    }

    levels.push({ id: levelId, label: levelLabel, subjects: levelSubjects });
  }

  const index = {
    generatedAt: new Date().toISOString(),
    totals: {
      levels: levels.length,
      subjects: subjects.length,
      notes: notes.length,
    },
    levels,
    subjects,
    notes,
  };

  await fs.mkdir(path.dirname(OUT_JSON), { recursive: true });
  await fs.writeFile(OUT_JSON, JSON.stringify(index, null, 2), "utf8");

  console.log(
    `✓ Índice generado: ${index.totals.levels} niveles, ${index.totals.subjects} materias, ${index.totals.notes} apuntes.`
  );
  if (extractFailures > 0) {
    console.warn(
      `  ⚠ ${extractFailures} archivo(s) sin texto extraído (búsqueda degradada para esos).`
    );
  }
  console.log(`  -> ${path.relative(ROOT, OUT_JSON)}`);
}

main().catch((err) => {
  console.error("✗ Error construyendo el índice de apuntes:", err);
  process.exit(1);
});
