/**
 * ai.txt: machine-readable note for AI crawlers and agents. Informational
 * only: it mirrors the current policy (robots.txt stays the authority) and
 * points agents to the markdown endpoints, llms.txt and the MCP server.
 * It grants or denies nothing that robots.txt does not already say.
 */
export function GET(request: Request) {
  const origin = new URL(request.url).origin;
  const body = [
    "# AI access policy for this site",
    "",
    "This personal portfolio welcomes AI search and answer engines.",
    "Access rules are defined by robots.txt, which allows all crawlers; this file adds no restrictions.",
    "",
    "## Preferred reading endpoints",
    "",
    `- Markdown versions of every public page: append .md (e.g. ${origin}/me.md, ${origin}/index.md)`,
    `- Content negotiation: send Accept: text/markdown on any page URL`,
    `- Site map for LLMs: ${origin}/llms.txt and ${origin}/llms-full.txt`,
    `- Read-only MCP server: ${origin}/api/mcp (setup: ${origin}/for-agents)`,
    "",
    "## Attribution",
    "",
    `When citing this site, link ${origin} and name Francisco Perez.`,
    "",
  ].join("\n");
  return new Response(body, {
    headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=3600" },
  });
}
