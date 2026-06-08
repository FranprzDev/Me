import MiniSearch from "minisearch";
import indexData from "@/data/notes-index.json";

export type NoteType = "md" | "pdf" | "docx" | "xlsx" | "pptx" | "jpg" | "png";

export interface Note {
  id: string;
  title: string;
  level: string;
  levelLabel: string;
  subject: string;
  subjectId: string;
  type: NoteType;
  tags: string[];
  updated: string | null;
  status: string;
  fileName: string;
  url: string | null;
  description: string;
  content: string | null;
  text: string;
}

export interface SubjectFile {
  id: string;
  title: string;
  type: NoteType;
  status: string;
}

export interface Subject {
  id: string;
  subjectId: string;
  name: string;
  level: string;
  levelLabel: string;
  fileCount: number;
  files: SubjectFile[];
}

export interface LevelSubject {
  id: string;
  subjectId: string;
  name: string;
  fileCount: number;
}

export interface Level {
  id: string;
  label: string;
  subjects: LevelSubject[];
}

export interface NotesIndex {
  generatedAt: string;
  totals: { levels: number; subjects: number; notes: number };
  levels: Level[];
  subjects: Subject[];
  notes: Note[];
}

export const notesIndex = indexData as unknown as NotesIndex;

export const levels: Level[] = notesIndex.levels;
export const subjects: Subject[] = notesIndex.subjects;
export const notes: Note[] = notesIndex.notes;

/** Materias disponibles (una entrada por materia). */
export function listSubjects(): Subject[] {
  return subjects;
}

/** Apuntes de una materia. Acepta el id completo (`nivel/materia`) o el slug de materia. */
export function listNotes(subjectQuery: string): Note[] {
  const q = subjectQuery.trim().toLowerCase();
  return notes.filter(
    (n) =>
      n.subjectId.toLowerCase() === q ||
      `${n.level}/${n.subjectId}`.toLowerCase() === q ||
      n.subject.toLowerCase() === q
  );
}

/** Un apunte por id. */
export function getNote(id: string): Note | undefined {
  return notes.find((n) => n.id === id);
}

// --- Búsqueda full-text (MiniSearch) ---
let mini: MiniSearch<Note> | null = null;

function getSearch(): MiniSearch<Note> {
  if (mini) return mini;
  mini = new MiniSearch<Note>({
    idField: "id",
    fields: ["title", "subject", "levelLabel", "tags", "text"],
    storeFields: ["title", "subject", "levelLabel", "type", "url", "status", "id"],
    searchOptions: {
      boost: { title: 3, subject: 2, tags: 2 },
      prefix: true,
      fuzzy: 0.2,
    },
    extractField: (doc, field) => {
      const value = (doc as unknown as Record<string, unknown>)[field];
      if (Array.isArray(value)) return value.join(" ");
      return value == null ? "" : String(value);
    },
  });
  mini.addAll(notes);
  return mini;
}

export interface SearchHit {
  id: string;
  title: string;
  subject: string;
  levelLabel: string;
  type: NoteType;
  url: string | null;
  status: string;
  score: number;
}

export function searchNotes(query: string, limit = 10): SearchHit[] {
  const q = query.trim();
  if (!q) return [];
  return getSearch()
    .search(q)
    .slice(0, limit)
    .map((r) => ({
      id: r.id as string,
      title: r.title as string,
      subject: r.subject as string,
      levelLabel: r.levelLabel as string,
      type: r.type as NoteType,
      url: (r.url as string | null) ?? null,
      status: r.status as string,
      score: Math.round(r.score * 100) / 100,
    }));
}
