"use client";

import { useRef, useState } from "react";
import { MCP_TOOLS } from "@/lib/mcp/tools";
import { CANONICAL_SITE_URL as SITE_URL } from "@/lib/site";
import { useI18n } from "@/lib/i18n";
import type { Lang } from "@/data/cv";

/** One-shot prompt handed to ChatGPT / Claude through their `?q=` links. */
export const ASSISTANT_PROMPT = [
  `Read Francisco Perez's portfolio at ${SITE_URL} and tell me about his profile, projects and experience.`,
  `The site also exposes a public, read-only MCP server at ${SITE_URL}/api/mcp (tools: ${MCP_TOOLS.join(", ")}) and an agent card at ${SITE_URL}/.well-known/agent-card.json. Use them if you can; otherwise read the pages ${SITE_URL}/hackathons, ${SITE_URL}/teaching, ${SITE_URL}/projects and ${SITE_URL}/education.`,
  "Summarize who he is, what he has built and where he has worked, and finish with his contact links. Only use information from those sources.",
].join("\n\n");

enum CopyState {
  Idle = "idle",
  Copied = "copied",
  Failed = "failed",
}

const COPY = {
  open_chatgpt: { es: "Abrir en ChatGPT", en: "Open in ChatGPT" },
  open_claude: { es: "Abrir en Claude", en: "Open in Claude" },
  copy: { es: "Copiar prompt", en: "Copy prompt" },
  copied: {
    es: "Prompt copiado. Pegalo en cualquier asistente.",
    en: "Prompt copied. Paste it into any assistant.",
  },
  failed: {
    es: "La copia está bloqueada acá: seleccioná el prompt de abajo.",
    en: "Copy is blocked here: select the prompt below instead.",
  },
  summary: { es: "Ver el prompt", en: "See the prompt" },
  new_tab: { es: " (abre en una pestaña nueva)", en: " (opens in a new tab)" },
} satisfies Record<string, Record<Lang, string>>;

const ASSISTANTS = [
  { id: "chatgpt", label: COPY.open_chatgpt, href: `https://chatgpt.com/?q=${encodeURIComponent(ASSISTANT_PROMPT)}` },
  { id: "claude", label: COPY.open_claude, href: `https://claude.ai/new?q=${encodeURIComponent(ASSISTANT_PROMPT)}` },
] as const;

/**
 * One-click launchers: open ChatGPT or Claude in a new tab with a prompt that
 * points them at this site and its MCP server, plus a copy-prompt fallback
 * for any other assistant (the prompt itself is readable below the buttons).
 */
export function AskAssistant() {
  const { tl } = useI18n();
  const [copy, setCopy] = useState<CopyState>(CopyState.Idle);
  const promptRef = useRef<HTMLDetailsElement>(null);

  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(ASSISTANT_PROMPT);
      setCopy(CopyState.Copied);
    } catch {
      setCopy(CopyState.Failed);
      // Reveal the prompt so it can be selected by hand.
      if (promptRef.current) promptRef.current.open = true;
    }
  };

  return (
    <div className="moon-launch">
      <div className="moon-launch__actions">
        {ASSISTANTS.map((assistant) => (
          <a
            key={assistant.id}
            href={assistant.href}
            target="_blank"
            rel="noopener noreferrer"
            className={`moon-launch__btn moon-launch__btn--${assistant.id}`}
          >
            <span>{tl(assistant.label)}</span>
            <span aria-hidden="true">↗</span>
            <span className="sr-only">{tl(COPY.new_tab)}</span>
          </a>
        ))}
        <button type="button" className="moon-launch__btn moon-launch__btn--copy" onClick={copyPrompt}>
          {tl(COPY.copy)}
        </button>
      </div>
      <p className="moon-launch__status" aria-live="polite">
        {copy === CopyState.Copied ? tl(COPY.copied) : null}
        {copy === CopyState.Failed ? tl(COPY.failed) : null}
      </p>
      <details ref={promptRef} className="moon-launch__prompt">
        <summary>{tl(COPY.summary)}</summary>
        <pre tabIndex={0}>
          <code>{ASSISTANT_PROMPT}</code>
        </pre>
      </details>
    </div>
  );
}
