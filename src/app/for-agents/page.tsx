import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";

export const metadata: Metadata = {
  title: "For AI agents (MCP) | Francisco Perez",
  description: "Connect any MCP client to Francisco Perez's read-only portfolio server at /api/mcp.",
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
    <main id="main-content" tabIndex={-1} className="section content-layer agents-page">
      <div className="wrap agents-wrap">
        <Link href="/" className="story-back">
          <span>← Back to the universe</span>
        </Link>

        <header className="agents-heading">
          <p className="eyebrow">MCP · Streamable HTTP · read-only</p>
          <h1 className="h-display">For AI agents</h1>
          <p>
            A public MCP server with Francisco Perez&apos;s portfolio data: profile, experience, CV, projects and contact.
            No sign-in, no LLM behind it, nothing is written. Every answer comes from the same data this site renders.
          </p>
        </header>

        <section className="glass agents-card" aria-labelledby="agents-endpoint">
          <h2 id="agents-endpoint">Endpoint</h2>
          <pre><code>{endpoint}</code></pre>

          <h3>Claude</h3>
          <p>Claude.ai or Claude Desktop: Settings → Connectors → Add custom connector, and paste the endpoint. Claude Code:</p>
          <pre><code>{`claude mcp add --transport http francisco-perez ${endpoint}`}</code></pre>

          <h3>ChatGPT</h3>
          <p>Settings → Connectors (developer mode) → Create, choose MCP server URL, paste the endpoint, no authentication.</p>

          <h3>Any MCP client (JSON config)</h3>
          <pre><code>{JSON.stringify({ mcpServers: { "francisco-perez": { type: "http", url: endpoint } } }, null, 2)}</code></pre>
        </section>

        <section className="glass agents-card" aria-labelledby="agents-tools">
          <h2 id="agents-tools">Tools</h2>
          <ul className="agents-tools">
            {TOOLS.map(([name, description]) => (
              <li key={name}>
                <code>{name}</code>
                <span>{description}</span>
              </li>
            ))}
          </ul>
          <p className="agents-note">
            Availability, salary and rankings are not part of the data: ask Francisco directly.
          </p>
        </section>
      </div>
    </main>
  );
}
