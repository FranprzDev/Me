import { createMcpHandler } from "mcp-handler";
import { z } from "zod";
import { listNotes, getNote, searchNotes, notesIndex } from "@/lib/notes";

// Base URL para construir links descargables de binarios.
// Prioridad: env explícita -> URL automática de Vercel -> relativa.
function resolveBaseUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (explicit) return explicit;
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
  if (vercel) return `https://${vercel.replace(/\/$/, "")}`;
  return "";
}

const SITE_URL = resolveBaseUrl();

function absUrl(url: string | null): string | null {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  return SITE_URL ? `${SITE_URL}${url}` : url;
}

function json(data: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}

const handler = createMcpHandler(
  (server) => {
    // 1) Materias disponibles
    server.tool(
      "list_subjects",
      "Lista todas las materias disponibles de Ingeniería en Sistemas (UTN-FRT), agrupadas por nivel. Útil para descubrir qué apuntes existen.",
      {},
      async () => {
        const data = {
          totals: notesIndex.totals,
          generatedAt: notesIndex.generatedAt,
          levels: notesIndex.levels.map((l) => ({
            level: l.id,
            label: l.label,
            subjects: l.subjects.map((s) => ({
              subjectId: s.subjectId,
              name: s.name,
              fileCount: s.fileCount,
            })),
          })),
        };
        return json(data);
      }
    );

    // 2) Apuntes de una materia
    server.tool(
      "list_notes",
      "Lista los apuntes (archivos) de una materia. El parámetro `subject` acepta el slug de la materia (ej. 'sistemas-operativos'), el id completo 'nivel/materia', o el nombre.",
      { subject: z.string().describe("Slug, id ('nivel/materia') o nombre de la materia") },
      async ({ subject }) => {
        const items = listNotes(subject);
        if (items.length === 0) {
          return json({
            subject,
            found: 0,
            hint: "Usá list_subjects para ver los slugs válidos.",
            notes: [],
          });
        }
        return json({
          subject,
          found: items.length,
          notes: items.map((n) => ({
            id: n.id,
            title: n.title,
            type: n.type,
            level: n.levelLabel,
            status: n.status,
            updated: n.updated,
            url: absUrl(n.url),
          })),
        });
      }
    );

    // 3) Obtener un apunte
    server.tool(
      "get_note",
      "Devuelve un apunte por su id. Para archivos .md devuelve el contenido completo en texto. Para binarios (pdf/docx/xlsx/pptx/jpg/png) devuelve metadata y la URL de descarga.",
      { id: z.string().describe("Id del apunte, ej. '2do-nivel/sistemas-operativos/sistemas-operativos'") },
      async ({ id }) => {
        const note = getNote(id);
        if (!note) {
          return json({ id, found: false, hint: "Usá list_notes para ver ids válidos." });
        }
        if (note.type === "md") {
          return {
            content: [
              {
                type: "text" as const,
                text:
                  `# ${note.title}\n` +
                  `Materia: ${note.subject} · Nivel: ${note.levelLabel}\n` +
                  `Estado: ${note.status}${note.updated ? ` · Actualizado: ${note.updated}` : ""}\n\n` +
                  `${note.content ?? ""}`,
              },
            ],
          };
        }
        return json({
          id: note.id,
          title: note.title,
          subject: note.subject,
          level: note.levelLabel,
          type: note.type,
          status: note.status,
          updated: note.updated,
          description: note.description,
          downloadUrl: absUrl(note.url),
          note: "Archivo binario: descargalo desde downloadUrl.",
        });
      }
    );

    // 4) Búsqueda full-text
    server.tool(
      "search_notes",
      "Búsqueda full-text en todos los apuntes (títulos, materias, tags y contenido extraído de md/pdf/docx/xlsx/pptx). Devuelve los apuntes más relevantes.",
      {
        query: z.string().describe("Texto a buscar"),
        limit: z.number().int().min(1).max(25).optional().describe("Máximo de resultados (default 10)"),
      },
      async ({ query, limit }) => {
        const hits = searchNotes(query, limit ?? 10);
        return json({
          query,
          found: hits.length,
          results: hits.map((h) => ({
            id: h.id,
            title: h.title,
            subject: h.subject,
            level: h.levelLabel,
            type: h.type,
            status: h.status,
            url: absUrl(h.url),
            score: h.score,
          })),
        });
      }
    );
  },
  {
    serverInfo: {
      name: "utn-frt-mcp",
      version: "0.1.0",
    },
  },
  {
    basePath: "/api",
    verboseLogs: false,
  }
);

export { handler as GET, handler as POST, handler as DELETE };
