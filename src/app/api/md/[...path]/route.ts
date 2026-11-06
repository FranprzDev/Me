/**
 * Single markdown endpoint behind every .md URL and Accept: text/markdown
 * negotiation (rewritten here by src/middleware.ts). Also directly
 * addressable as /api/md/<path> for debugging, and /api/md/_catalog lists
 * every markdown route. Never answers HTML.
 */
import { markdownNotFound, markdownPreflight, markdownResponse } from "@/lib/md/http";
import { listMarkdownRoutes, resolveMarkdown } from "@/lib/md/registry";

type RouteContext = { params: Promise<{ path?: string[] }> };

function render(request: Request, segments: string[] | undefined, negotiated: boolean): Response {
  const origin = new URL(request.url).origin;
  const joined = (segments ?? []).join("/");
  if (joined === "_catalog") {
    const body = ["# Markdown routes", "", ...listMarkdownRoutes().map((route) => `- ${absoluteMd(route)}`), ""].join("\n");
    return markdownResponse(body, { canonicalPath: "/for-agents", origin, negotiated });
  }
  const path = `/${joined}`;
  const route = resolveMarkdown(path);
  if (!route) return markdownNotFound(path, origin);
  const body = route.render(origin);
  return markdownResponse(body, { canonicalPath: route.path, origin, negotiated });
}

function absoluteMd(path: string): string {
  return path === "/" ? "/index.md" : `${path}.md`;
}

export async function GET(request: Request, context: RouteContext) {
  const { path } = await context.params;
  return render(request, path, request.headers.get("x-md-negotiated") === "1");
}

export async function HEAD(request: Request, context: RouteContext) {
  const response = await GET(request, context);
  return new Response(null, { status: response.status, headers: response.headers });
}

export async function OPTIONS() {
  return markdownPreflight();
}
