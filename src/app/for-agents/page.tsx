import type { Metadata } from "next";
import Link from "next/link";
import { AskAssistant } from "@/components/agents/AskAssistant";
import { LunarScene } from "@/components/agents/LunarScene";
import { SITE_OG_IMAGE, SITE_OPEN_GRAPH } from "@/lib/seo";
import "./for-agents.css";

export const metadata: Metadata = {
  title: "For AI agents (MCP) | Francisco Perez",
  description: "Open ChatGPT or Claude with a ready prompt that reads Francisco Perez's portfolio and its public, read-only MCP server.",
  alternates: { canonical: "/for-agents" },
  openGraph: {
    title: "For AI agents (MCP) | Francisco Perez",
    description: "A public, read-only MCP server with Francisco Perez's portfolio data: profile, experience, CV versions, projects and contact.",
    url: "/for-agents",
    type: "website",
    siteName: SITE_OPEN_GRAPH.siteName,
    images: [SITE_OG_IMAGE],
  },
};

export default function ForAgentsPage() {
  return (
    <main id="main-content" tabIndex={-1} className="content-layer agents-page moon">
      <section className="moon-hero" aria-labelledby="agents-title">
        <LunarScene />
        <div className="wrap moon-hero__copy">
          <Link href="/" className="story-back">
            <span>← Back to the universe</span>
          </Link>
          <p className="eyebrow moon-eyebrow">MCP · Streamable HTTP · read-only</p>
          <h1 id="agents-title" className="h-display">
            For AI agents
          </h1>
          <p className="moon-lede">
            You just touched down. This is a public MCP server with Francisco Perez&apos;s portfolio data: profile,
            experience, every CV version with its PDF, projects and contact. No sign-in, no LLM behind it, nothing is written. Every answer comes from
            the same data this site renders.
          </p>
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
          <h2 id="agents-ask">Ask an assistant</h2>
          <p>One click opens ChatGPT or Claude with a prompt that points it at this site and its MCP server.</p>
          <AskAssistant />
        </section>
      </div>
    </main>
  );
}
