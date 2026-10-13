import { NextResponse } from "next/server";

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
      "Read-only MCP server (Streamable HTTP) with Francisco Perez's public portfolio data: profile, experience, CV, projects and contact. No LLM, no authentication.",
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
        description: "Tools: get_profile, get_contact, get_experience, get_cv, list_projects, get_project(slug).",
        tags: ["mcp", "hiring", "software development", "AI engineering", "Tucumán"],
        examples: ["tools/call get_experience", "tools/call get_project {\"slug\":\"hackathons\"}"],
        inputModes: ["application/json"],
        outputModes: ["application/json"],
      },
    ],
  });
}
