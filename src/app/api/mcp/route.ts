import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { ErrorCode } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { CV_VARIANTS, CvVariant } from "@/content/cv";
import {
  Language,
  PROJECT_SLUGS,
  contact,
  cv,
  cvVersion,
  experience,
  listCvVersions,
  listProjects,
  primaryTitle,
  profile,
  projectBySlug,
} from "@/lib/mcp/portfolio";
import { MCP_SERVER_INFO, McpTool } from "@/lib/mcp/tools";
import { MCP_CORS_HEADERS, withCors } from "@/lib/mcp/http";

/**
 * Public, read-only MCP server (Streamable HTTP) for Francisco Perez's
 * portfolio. Stateless: every POST builds a fresh server over the static data
 * in src/data and src/content/cv (the CV versions the site publishes), answers
 * with plain JSON and keeps no session. No LLM, no secrets, no writes.
 *
 * Hardening on top of the SDK transport:
 * - CORS for browser-based clients (MCP Inspector, web agents): the data is
 *   public and no credentials are accepted, so any origin may call it.
 * - Clients that only accept application/json (or send no Accept header) are
 *   served, since this server never opens an SSE stream.
 * - Request bodies are capped well below the platform limit.
 */

export const dynamic = "force-dynamic";

/** The largest legitimate request (a tools/call with two short arguments) is well under 1 KiB. */
const MAX_REQUEST_BODY_BYTES = 64 * 1024;

enum MediaType {
  Json = "application/json",
  EventStream = "text/event-stream",
  Any = "*/*",
}

const languageInput = {
  language: z.enum(Language).default(Language.En).describe("Response language: 'en' (default) or 'es'."),
};

/** Version ids come from CvVariant, so the schema follows src/content/cv. */
const cvVersionIds = CV_VARIANTS.join(", ");

const readOnly = { readOnlyHint: true, destructiveHint: false, openWorldHint: false, idempotentHint: true } as const;

function json(data: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}

function buildServer(origin: string) {
  const server = new McpServer(MCP_SERVER_INFO, {
    instructions: `Read-only facts about Francisco Perez (${primaryTitle(Language.En)}, Tucumán, Argentina) taken from his portfolio. Use these tools instead of guessing; availability, salary and rankings are not part of the data. Tools that return text take an optional language ('en' default, or 'es'). His CV is published in several versions, one per kind of role: call ${McpTool.ListCvVersions} to pick the one that fits a role, then ${McpTool.GetCv} with that version for its content and PDF.`,
  });

  server.registerTool(
    McpTool.GetProfile,
    {
      title: "Profile",
      description: "Name, title, location, timezone, summary, highlights and main links (site, primary CV PDF, GitHub, LinkedIn).",
      inputSchema: languageInput,
      annotations: readOnly,
    },
    async ({ language }) => json(profile(language, origin))
  );

  server.registerTool(
    McpTool.GetContact,
    {
      title: "Contact",
      description: "Public contact channels: email, LinkedIn, GitHub and WhatsApp, plus his timezone. Takes no arguments.",
      annotations: readOnly,
    },
    async () => json(contact())
  );

  server.registerTool(
    McpTool.GetExperience,
    {
      title: "Work experience",
      description: "Roles, organizations, periods, descriptions and stack, as the portfolio's home page lists them.",
      inputSchema: languageInput,
      annotations: readOnly,
    },
    async ({ language }) => json(experience(language))
  );

  server.registerTool(
    McpTool.ListCvVersions,
    {
      title: "CV versions",
      description: `The CV versions published on the site, one per kind of role (ids: ${cvVersionIds}). Each has its name, headline, web page URL and PDF URL. Call this first to choose the version that fits a role, then ${McpTool.GetCv} with its id.`,
      inputSchema: languageInput,
      annotations: readOnly,
    },
    async ({ language }) => json(listCvVersions(language, origin))
  );

  server.registerTool(
    McpTool.GetCv,
    {
      title: "Full CV",
      description: `Without version: profile, experience, education and certifications in one document, the PDF link, and the available CV versions with their PDF links. With version (an id from ${McpTool.ListCvVersions}): that version's content, section by section as its CV page shows it, plus its page URL and PDF URL.`,
      inputSchema: {
        ...languageInput,
        version: z
          .enum(CvVariant)
          .optional()
          .describe(`Optional CV version id, one of: ${cvVersionIds}. Use ${McpTool.ListCvVersions} to choose by role.`),
      },
      annotations: readOnly,
    },
    async ({ language, version }) => json(version ? cvVersion(version, language, origin) : cv(language, origin))
  );

  server.registerTool(
    McpTool.ListProjects,
    {
      title: "Portfolio worlds",
      description: `The portfolio's project areas (worlds) with slug, title, tagline, years and page URL. Slugs: ${PROJECT_SLUGS.join(", ")}.`,
      inputSchema: languageInput,
      annotations: readOnly,
    },
    async ({ language }) => json(listProjects(language, origin))
  );

  server.registerTool(
    McpTool.GetProject,
    {
      title: "Project world details",
      description: `Every entry of one portfolio world (hackathons, courses, personal projects, education) with years, descriptions, stack and links. Requires slug, one of: ${PROJECT_SLUGS.join(", ")}.`,
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

  // The tool set is fixed and the server is stateless, so it never sends
  // notifications/tools/list_changed; do not advertise that it might.
  server.server.registerCapabilities({ tools: { listChanged: false } });

  return server;
}

/**
 * The spec asks clients to accept both JSON and SSE, and the SDK transport
 * rejects anything else with 406. This server only ever answers with JSON, so
 * a client that accepts JSON (explicitly, through a wildcard or by sending no
 * Accept header) is served instead of turned away.
 */
function withLenientAccept(request: Request): Request {
  const accept = request.headers.get("accept") ?? "";
  if (accept.includes(MediaType.EventStream) && accept.includes(MediaType.Json)) return request;
  const acceptsJson = accept === "" || accept.includes(MediaType.Json) || accept.includes(MediaType.Any);
  if (!acceptsJson) return request;
  const headers = new Headers(request.headers);
  headers.set("accept", `${MediaType.Json}, ${MediaType.EventStream}`);
  return new Request(request, { headers });
}

async function handle(request: Request): Promise<Response> {
  const origin = new URL(request.url).origin;
  const server = buildServer(origin);
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // stateless
    enableJsonResponse: true,
    maxRequestBodySize: MAX_REQUEST_BODY_BYTES,
  });
  await server.connect(transport);
  try {
    return withCors(await transport.handleRequest(withLenientAccept(request)));
  } finally {
    void server.close();
  }
}

export async function POST(request: Request) {
  return handle(request);
}

/** Stateless server: no SSE stream to open and no session to delete. */
function methodNotAllowed() {
  return withCors(
    Response.json(
      {
        jsonrpc: "2.0",
        // -32000 is the code the SDK transport itself uses for HTTP-level rejections.
        error: { code: ErrorCode.ConnectionClosed, message: "Method not allowed. Send JSON-RPC requests with POST." },
        id: null,
      },
      { status: 405, headers: { Allow: "POST, OPTIONS" } }
    )
  );
}

export async function GET() {
  return methodNotAllowed();
}

export async function DELETE() {
  return methodNotAllowed();
}

/** CORS preflight for browser-based MCP clients. */
export async function OPTIONS() {
  return new Response(null, { status: 204, headers: { ...MCP_CORS_HEADERS, Allow: "POST, OPTIONS" } });
}
