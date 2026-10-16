/**
 * Names and one-line summaries of the portfolio MCP tools. Shared by the MCP
 * route, the agent card, the /for-agents page and the assistant prompt so the
 * public tool list cannot drift from what the server registers. Kept free of
 * portfolio data so client components can import it cheaply.
 */
export enum McpTool {
  GetProfile = "get_profile",
  GetContact = "get_contact",
  GetExperience = "get_experience",
  ListCvVersions = "list_cv_versions",
  GetCv = "get_cv",
  ListProjects = "list_projects",
  GetProject = "get_project",
}

/** Server identity reported by initialize and repeated in the agent card. */
export const MCP_SERVER_INFO = { name: "francisco-perez-portfolio", version: "1.3.0" } as const;

/** Protocol revision the server is built and tested against. */
export const MCP_PROTOCOL_VERSION = "2025-06-18";

/** Path of the Streamable HTTP endpoint. */
export const MCP_ENDPOINT_PATH = "/api/mcp";

/** Every tool, in the order the docs list them. */
export const MCP_TOOLS: McpTool[] = Object.values(McpTool);

export const MCP_TOOL_SUMMARIES: Record<McpTool, string> = {
  [McpTool.GetProfile]: "Name, title, location, summary, highlights and links.",
  [McpTool.GetContact]: "Email, LinkedIn, GitHub and WhatsApp.",
  [McpTool.GetExperience]: "Work experience with periods and stack.",
  [McpTool.ListCvVersions]:
    "The CV versions the site publishes (one per kind of role), each with its headline, page URL and PDF URL. Call it to pick the right CV for a role.",
  [McpTool.GetCv]:
    "Full CV: profile, experience, education, certifications and the PDF link. Pass a version from list_cv_versions to get that version's content, page and PDF.",
  [McpTool.ListProjects]: "The portfolio worlds (project areas) with slug, title and page URL.",
  [McpTool.GetProject]: "Every entry of one world by slug.",
};
