import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { z } from "zod";
import {
  Language,
  PROJECT_SLUGS,
  contact,
  cv,
  experience,
  listProjects,
  profile,
  projectBySlug,
} from "@/lib/mcp/portfolio";

/**
 * Public, read-only MCP server (Streamable HTTP) for Francisco Perez's
 * portfolio. Stateless: every POST builds a fresh server over the static data
 * in src/data, answers with plain JSON and keeps no session. No LLM, no
 * secrets, no writes.
 */

export const dynamic = "force-dynamic";

const languageInput = {
  language: z.enum(Language).default(Language.En).describe("Response language: 'en' (default) or 'es'."),
};

const readOnly = { readOnlyHint: true, openWorldHint: false, idempotentHint: true } as const;

function json(data: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}

function buildServer(origin: string) {
  const server = new McpServer(
    { name: "francisco-perez-portfolio", version: "1.0.0" },
    {
      instructions:
        "Read-only facts about Francisco Perez (AI Applied Engineer, Tucumán, Argentina) taken from his portfolio. Use these tools instead of guessing; availability, salary and rankings are not part of the data.",
    }
  );

  server.registerTool(
    "get_profile",
    {
      title: "Profile",
      description: "Name, title, location, summary, highlights and main links.",
      inputSchema: languageInput,
      annotations: readOnly,
    },
    async ({ language }) => json(profile(language, origin))
  );

  server.registerTool(
    "get_contact",
    {
      title: "Contact",
      description: "Public contact channels: email, LinkedIn, GitHub and WhatsApp.",
      annotations: readOnly,
    },
    async () => json(contact())
  );

  server.registerTool(
    "get_experience",
    {
      title: "Work experience",
      description: "Roles, organizations, periods, descriptions and stack, newest first.",
      inputSchema: languageInput,
      annotations: readOnly,
    },
    async ({ language }) => json(experience(language))
  );

  server.registerTool(
    "get_cv",
    {
      title: "Full CV",
      description: "Profile, experience, education and certifications in one document, plus the PDF link.",
      inputSchema: languageInput,
      annotations: readOnly,
    },
    async ({ language }) => json(cv(language, origin))
  );

  server.registerTool(
    "list_projects",
    {
      title: "Portfolio worlds",
      description: `The portfolio's project areas (worlds) with slug, tagline and page URL. Slugs: ${PROJECT_SLUGS.join(", ")}.`,
      inputSchema: languageInput,
      annotations: readOnly,
    },
    async ({ language }) => json(listProjects(language, origin))
  );

  server.registerTool(
    "get_project",
    {
      title: "Project world details",
      description: "Every entry of one portfolio world (hackathons, courses, personal projects, education) with years, descriptions, stack and links.",
      inputSchema: {
        slug: z.enum(PROJECT_SLUGS as [string, ...string[]]).describe(`One of: ${PROJECT_SLUGS.join(", ")}.`),
        ...languageInput,
      },
      annotations: readOnly,
    },
    async ({ slug, language }) => {
      const project = projectBySlug(slug, language, origin);
      if (!project) return { isError: true, content: [{ type: "text" as const, text: `Unknown slug: ${slug}` }] };
      return json(project);
    }
  );

  return server;
}

async function handle(request: Request) {
  const origin = new URL(request.url).origin;
  const server = buildServer(origin);
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // stateless
    enableJsonResponse: true,
  });
  await server.connect(transport);
  try {
    return await transport.handleRequest(request);
  } finally {
    void server.close();
  }
}

export async function POST(request: Request) {
  return handle(request);
}

/** Stateless server: no SSE stream to open and no session to delete. */
function methodNotAllowed() {
  return Response.json(
    { jsonrpc: "2.0", error: { code: -32000, message: "Method not allowed. Send JSON-RPC requests with POST." }, id: null },
    { status: 405, headers: { Allow: "POST" } }
  );
}

export async function GET() {
  return methodNotAllowed();
}

export async function DELETE() {
  return methodNotAllowed();
}
