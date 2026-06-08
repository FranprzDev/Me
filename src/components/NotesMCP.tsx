"use client";

import { useState, useEffect } from "react";
import { useI18n } from "@/lib/i18n";
import { Reveal } from "@/components/Reveal";
import indexData from "@/data/notes-index.json";

interface LevelShape {
  id: string;
  label: string;
  subjects: { subjectId: string; name: string; fileCount: number }[];
}
const idx = indexData as unknown as {
  totals: { levels: number; subjects: number; notes: number };
  levels: LevelShape[];
};

const TOOLS = [
  {
    name: "list_subjects",
    es: "Lista todas las materias por nivel.",
    en: "Lists every subject by level.",
  },
  {
    name: "list_notes",
    es: "Lista los apuntes de una materia.",
    en: "Lists the notes of a subject.",
  },
  {
    name: "get_note",
    es: "Trae un apunte (texto .md o URL del binario).",
    en: "Fetches a note (.md text or binary URL).",
  },
  {
    name: "search_notes",
    es: "Búsqueda full-text en todos los apuntes.",
    en: "Full-text search across all notes.",
  },
];

export function NotesMCP() {
  const { t, lang } = useI18n();
  const [origin, setOrigin] = useState("https://tu-portfolio.vercel.app");
  const [activeLevel, setActiveLevel] = useState(idx.levels[0]?.id ?? "");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Origin real solo en cliente (evita mismatch SSR).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (typeof window !== "undefined") setOrigin(window.location.origin);
  }, []);

  const cmd = `claude mcp add --transport http utn-frt ${origin}/api/mcp`;
  const level = idx.levels.find((l) => l.id === activeLevel);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(cmd);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* noop */
    }
  };

  const stats = [
    { n: idx.totals.levels, label: t("mcp_stat_levels") },
    { n: idx.totals.subjects, label: t("mcp_stat_subjects") },
    { n: idx.totals.notes, label: t("mcp_stat_notes") },
  ];

  return (
    <section id="mcp" className="section">
      <div className="wrap">
        <Reveal>
          <span className="chip" style={{ color: "var(--japan-2,#e9b949)", borderColor: "var(--japan-2,#e9b949)" }}>
            ◆ {t("mcp_tag")}
          </span>
          <h2 className="h-display glow-japan" style={{ fontSize: "clamp(2.2rem, 6vw, 4.2rem)", margin: "0.8rem 0 0.6rem" }}>
            {t("mcp_title")}
          </h2>
          <p style={{ fontSize: "1.2rem", color: "var(--fg)", maxWidth: 720, margin: "0 0 0.6rem" }}>
            {t("mcp_subtitle")}
          </p>
          <p style={{ color: "var(--muted)", maxWidth: 720, lineHeight: 1.7 }}>{t("mcp_desc")}</p>
        </Reveal>

        {/* Stats */}
        <Reveal delay={0.1}>
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", margin: "1.8rem 0" }}>
            {stats.map((s) => (
              <div key={s.label} className="glass" style={{ padding: "1rem 1.6rem", textAlign: "center", minWidth: 120 }}>
                <div className="h-display accent-japan" style={{ fontSize: "2.4rem", lineHeight: 1 }}>{s.n}</div>
                <div className="eyebrow" style={{ marginTop: "0.4rem" }}>{s.label}</div>
              </div>
            ))}
          </div>
        </Reveal>

        <div style={{ display: "grid", gap: "1.2rem", gridTemplateColumns: "1fr", alignItems: "start" }}>
          {/* Cómo conectar */}
          <Reveal delay={0.12}>
            <div className="glass" style={{ padding: "1.5rem" }}>
              <h3 className="h-display" style={{ fontSize: "1.4rem", margin: "0 0 0.8rem" }}>{t("mcp_how")}</h3>
              <div style={{ position: "relative" }}>
                <pre className="code-block" style={{ margin: 0, paddingRight: "5rem" }}>{cmd}</pre>
                <button
                  onClick={copy}
                  className="chip"
                  style={{ position: "absolute", top: 10, right: 10, cursor: "pointer", color: "var(--fg)" }}
                >
                  {copied ? "✓ ok" : "copy"}
                </button>
              </div>
              <p style={{ color: "var(--muted)", fontSize: "0.82rem", marginTop: "0.7rem" }}>
                {lang === "es"
                  ? "Funciona con cualquier cliente MCP por HTTP (Claude Code, Cursor, etc.)."
                  : "Works with any HTTP MCP client (Claude Code, Cursor, etc.)."}
              </p>
            </div>
          </Reveal>

          {/* Tools */}
          <Reveal delay={0.16}>
            <div className="glass" style={{ padding: "1.5rem" }}>
              <h3 className="h-display" style={{ fontSize: "1.4rem", margin: "0 0 0.8rem" }}>{t("mcp_tools")}</h3>
              <div style={{ display: "grid", gap: "0.6rem" }}>
                {TOOLS.map((tool) => (
                  <div key={tool.name} className="glass-soft" style={{ padding: "0.7rem 0.9rem", display: "flex", gap: "0.7rem", alignItems: "baseline" }}>
                    <code className="accent-japan" style={{ fontFamily: "var(--font-geist-mono)", fontWeight: 600, fontSize: "0.85rem" }}>
                      {tool.name}
                    </code>
                    <span style={{ color: "var(--muted)", fontSize: "0.85rem" }}>{lang === "es" ? tool.es : tool.en}</span>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>

        {/* Explorador de materias */}
        <Reveal delay={0.2}>
          <div style={{ marginTop: "1.5rem" }}>
            <h3 className="h-display" style={{ fontSize: "1.5rem", margin: "0 0 1rem" }}>{t("mcp_browse")}</h3>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1rem" }}>
              {idx.levels.map((l) => (
                <button
                  key={l.id}
                  onClick={() => setActiveLevel(l.id)}
                  className="chip"
                  style={{
                    cursor: "pointer",
                    color: l.id === activeLevel ? "var(--bg)" : "var(--muted)",
                    background: l.id === activeLevel ? "var(--japan)" : undefined,
                    borderColor: l.id === activeLevel ? "var(--japan)" : undefined,
                  }}
                >
                  {l.label}
                </button>
              ))}
            </div>
            <div style={{ display: "grid", gap: "0.6rem", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}>
              {level?.subjects.map((s) => (
                <div key={s.subjectId} className="glass-soft tilt-card" style={{ padding: "0.8rem 1rem", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.5rem" }}>
                  <span style={{ fontSize: "0.9rem" }}>{s.name}</span>
                  <span className="chip" style={{ fontSize: "0.66rem" }}>{s.fileCount}</span>
                </div>
              ))}
            </div>
            <p style={{ color: "var(--muted)", fontSize: "0.82rem", marginTop: "1rem", opacity: 0.8 }}>* {t("mcp_note")}</p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
