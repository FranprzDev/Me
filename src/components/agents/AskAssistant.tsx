"use client";

import { useRef, useState } from "react";
import { MCP_TOOLS } from "@/lib/mcp/tools";

/** Public production URL the assistants are asked to read. */
const SITE_URL = "https://me-pink-ten.vercel.app";

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

const ASSISTANTS = [
  { id: "chatgpt", label: "Open in ChatGPT", href: `https://chatgpt.com/?q=${encodeURIComponent(ASSISTANT_PROMPT)}` },
  { id: "claude", label: "Open in Claude", href: `https://claude.ai/new?q=${encodeURIComponent(ASSISTANT_PROMPT)}` },
] as const;

/**
 * One-click launchers: open ChatGPT or Claude in a new tab with a prompt that
 * points them at this site and its MCP server, plus a copy-prompt fallback
 * for any other assistant (the prompt itself is readable below the buttons).
 */
export function AskAssistant() {
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
            <span>{assistant.label}</span>
            <span aria-hidden="true">↗</span>
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        ))}
        <button type="button" className="moon-launch__btn moon-launch__btn--copy" onClick={copyPrompt}>
          Copy prompt
        </button>
      </div>
      <p className="moon-launch__status" aria-live="polite">
        {copy === CopyState.Copied ? "Prompt copied. Paste it into any assistant." : null}
        {copy === CopyState.Failed ? "Copy is blocked here: select the prompt below instead." : null}
      </p>
      <details ref={promptRef} className="moon-launch__prompt">
        <summary>See the prompt</summary>
        <pre tabIndex={0}>
          <code>{ASSISTANT_PROMPT}</code>
        </pre>
      </details>
    </div>
  );
}
