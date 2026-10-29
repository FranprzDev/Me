"use client";

import Link from "next/link";
import { AskAssistant } from "@/components/agents/AskAssistant";
import { LunarScene } from "@/components/agents/LunarScene";
import { useI18n } from "@/lib/i18n";
import type { Lang } from "@/data/cv";

const COPY = {
  eyebrow: {
    es: "MCP · Streamable HTTP · solo lectura",
    en: "MCP · Streamable HTTP · read-only",
  },
  title: { es: "Para agentes de IA", en: "For AI agents" },
  lede: {
    es: "Acabás de aterrizar. Este es un servidor MCP público con los datos del portfolio de Francisco Perez: perfil, experiencia, cada versión del CV con su PDF, proyectos y contacto. Sin inicio de sesión, sin LLM detrás, nada se escribe. Cada respuesta sale de los mismos datos que muestra este sitio.",
    en: "You just touched down. This is a public MCP server with Francisco Perez's portfolio data: profile, experience, every CV version with its PDF, projects and contact. No sign-in, no LLM behind it, nothing is written. Every answer comes from the same data this site renders.",
  },
  ask_title: { es: "Preguntale a un asistente", en: "Ask an assistant" },
  ask_lede: {
    es: "Un clic abre ChatGPT o Claude con un prompt que lo apunta a este sitio y a su servidor MCP.",
    en: "One click opens ChatGPT or Claude with a prompt that points it at this site and its MCP server.",
  },
} satisfies Record<string, Record<Lang, string>>;

export function ForAgentsContent() {
  const { t, tl } = useI18n();
  return (
    <main id="main-content" tabIndex={-1} className="content-layer agents-page moon">
      <section className="moon-hero" aria-labelledby="agents-title">
        <LunarScene />
        <div className="wrap moon-hero__copy">
          <Link href="/" className="story-back">
            <span>{t("proj_back")}</span>
          </Link>
          <p className="eyebrow moon-eyebrow">{tl(COPY.eyebrow)}</p>
          <h1 id="agents-title" className="h-display">
            {tl(COPY.title)}
          </h1>
          <p className="moon-lede">{tl(COPY.lede)}</p>
          <p className="moon-coords">
            <span>Tranquility Base</span>
            <span>0.674° N · 23.473° E</span>
          </p>
        </div>
      </section>

      <div className="wrap moon-deck">
        <section className="moon-panel" aria-labelledby="agents-ask">
          <header className="moon-panel__bar" aria-hidden="true">
            <span className="moon-panel__led">GO</span>
          </header>
          <h2 id="agents-ask">{tl(COPY.ask_title)}</h2>
          <p>{tl(COPY.ask_lede)}</p>
          <AskAssistant />
        </section>
      </div>
    </main>
  );
}
