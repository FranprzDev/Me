import { NextResponse } from "next/server";
import { MCP_CORS_HEADERS } from "@/lib/mcp/http";
import { MCP_ENDPOINT_PATH, MCP_PROTOCOL_VERSION, MCP_SERVER_INFO, MCP_TOOLS, McpTool } from "@/lib/mcp/tools";

/**
 * Discovery card. The portfolio's agent interface is a read-only MCP server
 * (Streamable HTTP) at /api/mcp; this card points agents to it, to the
 * how-to-connect page and to llms.txt.
 */
export function GET(request: Request) {
  const endpoint = new URL(MCP_ENDPOINT_PATH, request.url).toString();
  return NextResponse.json(
    {
      protocolVersion: "0.3.0",
      name: "Francisco Perez Portfolio",
      description:
        "Read-only MCP server (Streamable HTTP) with Francisco Perez's public portfolio data: profile, experience, CV (every published version, one per kind of role, with PDF links), projects and contact. No LLM, no authentication.",
      url: endpoint,
      preferredTransport: "MCP",
      documentationUrl: new URL("/for-agents", request.url).toString(),
      version: "2.0.0",
      capabilities: { streaming: false },
      defaultInputModes: ["application/json"],
      defaultOutputModes: ["application/json"],
      mcp: {
        endpoint,
        transport: "streamable-http",
        protocolVersion: MCP_PROTOCOL_VERSION,
        serverInfo: MCP_SERVER_INFO,
        tools: MCP_TOOLS,
        authentication: "none",
        llmsTxt: new URL("/llms.txt", request.url).toString(),
      },
      skills: [
        {
          id: "portfolio-mcp",
          name: "Portfolio MCP tools",
          description: `Tools: ${MCP_TOOLS.join(", ")}. Call ${McpTool.ListCvVersions} to pick the CV version that fits a role, then ${McpTool.GetCv} with that version for its content and PDF.`,
          tags: ["mcp", "hiring", "cv", "software development", "AI engineering", "Tucumán"],
          examples: [
            `tools/call ${McpTool.GetExperience}`,
            `tools/call ${McpTool.ListCvVersions}`,
            `tools/call ${McpTool.GetCv} {"version":"<id from ${McpTool.ListCvVersions}>"}`,
            `tools/call ${McpTool.GetProject} {"slug":"hackathons"}`,
          ],
          inputModes: ["application/json"],
          outputModes: ["application/json"],
        },
      ],
    },
    { headers: MCP_CORS_HEADERS }
  );
}
