import { MCP_CORS_HEADERS } from "@/lib/mcp/http";
import { Language, contact, listCvVersions, listProjects, primaryTitle, profile } from "@/lib/mcp/portfolio";
import { MCP_ENDPOINT_PATH, MCP_TOOLS, MCP_TOOL_SUMMARIES } from "@/lib/mcp/tools";

/**
 * llms.txt (https://llmstxt.org): a plain-markdown map of the site for LLMs
 * and agents. Built from the same sources as the MCP server, so the tool list,
 * CV versions and links cannot drift from what the server answers.
 */
export function GET(request: Request) {
  const origin = new URL(request.url).origin;
  const me = profile(Language.En, origin);
  const channels = contact();
  const endpoint = new URL(MCP_ENDPOINT_PATH, origin).toString();

  const lines = [
    `# ${me.name}`,
    "",
    `> ${primaryTitle(Language.En)} in ${me.location}. ${me.summary}`,
    "",
    "## MCP server",
    "",
    `Public, read-only MCP server (Streamable HTTP, no authentication) at ${endpoint}. Setup for Claude, ChatGPT, Cursor and VS Code: ${origin}/for-agents. Agent card: ${origin}/.well-known/agent-card.json. Tools that return text take an optional language ('en' default, or 'es').`,
    "",
    ...MCP_TOOLS.map((tool) => `- ${tool}: ${MCP_TOOL_SUMMARIES[tool]}`),
    "",
    "## CV",
    "",
    ...listCvVersions(Language.En, origin).versions.map(
      (version) => `- [${version.name} CV](${version.page_url}): ${version.headline}. PDF: ${version.pdf_url}`
    ),
    "",
    "## Portfolio",
    "",
    `- [Home](${me.links.site})`,
    `- [About and experience](${origin}/me)`,
    ...listProjects(Language.En, origin).map((project) => `- [${project.title}](${project.url})`),
    "",
    "## Contact",
    "",
    `- Email: ${channels.email}`,
    `- LinkedIn: ${channels.linkedin}`,
    `- GitHub: ${channels.github}`,
    "",
  ];

  return new Response(lines.join("\n"), {
    headers: { ...MCP_CORS_HEADERS, "Content-Type": "text/plain; charset=utf-8" },
  });
}
