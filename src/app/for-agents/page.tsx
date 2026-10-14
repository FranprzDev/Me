import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { AskAssistant } from "@/components/agents/AskAssistant";
import { LunarScene } from "@/components/agents/LunarScene";
import "./for-agents.css";

export const metadata: Metadata = {
  title: "For AI agents (MCP) | Francisco Perez",
  description: "Connect any MCP client to Francisco Perez's read-only portfolio server at /api/mcp, or open ChatGPT or Claude with a ready prompt.",
};

const TOOLS = [
  ["get_profile", "Name, title, location, summary, highlights and links."],
  ["get_contact", "Email, LinkedIn, GitHub and WhatsApp."],
  ["get_experience", "Work experience with periods and stack."],
  ["get_cv", "Full CV: profile, experience, education, certifications and the PDF link."],
  ["list_projects", "The four portfolio worlds with slug, tagline and page URL."],
  ["get_project", "Every entry of one world by slug."],
] as const;

export default async function ForAgentsPage() {
  const host = (await headers()).get("host") ?? "me-pink-ten.vercel.app";
  const protocol = host.startsWith("localhost") ? "http" : "https";
  const endpoint = `${protocol}://${host}/api/mcp`;

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
            experience, CV, projects and contact. No sign-in, no LLM behind it, nothing is written. Every answer comes from
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
            <span>CH-00 // QUICK LAUNCH</span>
            <span className="moon-panel__led">GO</span>
          </header>
          <h2 id="agents-ask">Ask an assistant</h2>
          <p>One click opens ChatGPT or Claude with a prompt that points it at this site and its MCP server.</p>
          <AskAssistant />
        </section>

        <section className="moon-panel" aria-labelledby="agents-endpoint">
          <header className="moon-panel__bar" aria-hidden="true">
            <span>CH-01 // UPLINK</span>
            <span className="moon-panel__led">NOMINAL</span>
          </header>
          <h2 id="agents-endpoint">Endpoint</h2>
          <pre tabIndex={0}>
            <code>{endpoint}</code>
          </pre>

          <h3>Claude</h3>
          <p>Claude.ai or Claude Desktop: Settings → Connectors → Add custom connector, and paste the endpoint. Claude Code:</p>
          <pre tabIndex={0}>
            <code>{`claude mcp add --transport http francisco-perez ${endpoint}`}</code>
          </pre>

          <h3>ChatGPT</h3>
          <p>Settings → Connectors (developer mode) → Create, choose MCP server URL, paste the endpoint, no authentication.</p>

          <h3>Any MCP client (JSON config)</h3>
          <pre tabIndex={0}>
            <code>{JSON.stringify({ mcpServers: { "francisco-perez": { type: "http", url: endpoint } } }, null, 2)}</code>
          </pre>
        </section>

        <section className="moon-panel" aria-labelledby="agents-tools">
          <header className="moon-panel__bar" aria-hidden="true">
            <span>CH-02 // PAYLOAD MANIFEST</span>
            <span className="moon-panel__led">{String(TOOLS.length).padStart(2, "0")} TOOLS</span>
          </header>
          <h2 id="agents-tools">Tools</h2>
          <ol className="agents-tools">
            {TOOLS.map(([name, description], index) => (
              <li key={name}>
                <span className="agents-tools__index" aria-hidden="true">
                  T-{String(index + 1).padStart(2, "0")}
                </span>
                <code>{name}</code>
                <span>{description}</span>
              </li>
            ))}
          </ol>
          <p className="agents-note">Availability, salary and rankings are not part of the data: ask Francisco directly.</p>
        </section>
      </div>
    </main>
  );
}
