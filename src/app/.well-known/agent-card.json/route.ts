import { NextResponse } from "next/server";
import { MCP_TOOLS, McpTool } from "@/lib/mcp/tools";

/**
 * Discovery card. The portfolio's agent interface is a read-only MCP server
 * (Streamable HTTP) at /api/mcp; this card points agents to it and to the
 * how-to-connect page.
 */
export function GET(request: Request) {
  const endpoint = new URL("/api/mcp", request.url).toString();
  return NextResponse.json({
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
  });
}
