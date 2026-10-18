import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { AskAssistant } from "@/components/agents/AskAssistant";
import { LunarScene } from "@/components/agents/LunarScene";
import { MCP_ENDPOINT_PATH, MCP_TOOLS, MCP_TOOL_SUMMARIES } from "@/lib/mcp/tools";
import { SITE_HOST } from "@/lib/site";
import { SITE_OG_IMAGE, SITE_OPEN_GRAPH } from "@/lib/seo";
import "./for-agents.css";

export const metadata: Metadata = {
  title: "For AI agents (MCP) | Francisco Perez",
  description: "Connect any MCP client to Francisco Perez's read-only portfolio server at /api/mcp, or open ChatGPT or Claude with a ready prompt.",
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

const TOOLS = MCP_TOOLS.map((name) => [name, MCP_TOOL_SUMMARIES[name]] as const);

/** Name the copy-paste configs register the server under. */
const SERVER_KEY = "francisco-perez";

export default async function ForAgentsPage() {
  const host = (await headers()).get("host") ?? SITE_HOST;
  const protocol = host.startsWith("localhost") ? "http" : "https";
  const endpoint = `${protocol}://${host}${MCP_ENDPOINT_PATH}`;

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

        <section className="moon-panel" aria-labelledby="agents-endpoint">
          <header className="moon-panel__bar" aria-hidden="true">
            <span className="moon-panel__led">NOMINAL</span>
          </header>
          <h2 id="agents-endpoint">Endpoint</h2>
          <pre tabIndex={0}>
            <code>{endpoint}</code>
          </pre>

          <h3>Claude</h3>
          <p>Claude.ai or Claude Desktop: Settings → Connectors → Add custom connector, and paste the endpoint. Claude Code:</p>
          <pre tabIndex={0}>
            <code>{`claude mcp add --transport http ${SERVER_KEY} ${endpoint}`}</code>
          </pre>

          <h3>ChatGPT</h3>
          <p>Settings → Connectors (developer mode) → Create, choose MCP server URL, paste the endpoint, no authentication.</p>

          <h3>Cursor, Claude Code and other mcpServers configs</h3>
          <p>
            Add to <code>~/.cursor/mcp.json</code>, a project <code>.mcp.json</code> or any client that reads an{" "}
            <code>mcpServers</code> map:
          </p>
          <pre tabIndex={0}>
            <code>{JSON.stringify({ mcpServers: { [SERVER_KEY]: { type: "http", url: endpoint } } }, null, 2)}</code>
          </pre>

          <h3>VS Code</h3>
          <p>
            Add to <code>.vscode/mcp.json</code> (or run MCP: Add Server → HTTP):
          </p>
          <pre tabIndex={0}>
            <code>{JSON.stringify({ servers: { [SERVER_KEY]: { type: "http", url: endpoint } } }, null, 2)}</code>
          </pre>

          <h3>Try it from a terminal</h3>
          <p>The official MCP Inspector lists the tools without installing anything:</p>
          <pre tabIndex={0}>
            <code>{`npx @modelcontextprotocol/inspector --cli ${endpoint} --transport http --method tools/list`}</code>
          </pre>
        </section>

        <section className="moon-panel" aria-labelledby="agents-tools">
          <header className="moon-panel__bar" aria-hidden="true">
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
