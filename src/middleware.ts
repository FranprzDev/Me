/**
 * Routes AI-agent readers to the markdown pipeline (src/lib/md):
 * - GET /me.md            -> /api/md/me
 * - GET /index.md         -> /api/md/index (homepage)
 * - GET /me with Accept: text/markdown outranking text/html -> same
 * HTML is ALWAYS the default: a missing Accept or one without an explicit
 * text/markdown preference (including a wildcard range) never rewrites.
 * Only the allowlisted content routes below negotiate; /api/*, /_next/*,
 * /.well-known/*, llms/ai/robots/sitemap and static assets never match.
 */
import { NextRequest, NextResponse } from "next/server";
import { PROJECT_SLUGS } from "@/lib/mcp/portfolio";
import { CV_VARIANTS, cvPath } from "@/content/cv/routes";
import { CvLocale } from "@/content/cv/types";

const STATIC_ROUTES = ["/", "/me", "/for-agents", "/cv", "/es/cv"];
const CONTENT_ROUTES = new Set([
  ...STATIC_ROUTES,
  ...PROJECT_SLUGS.map((slug) => `/${slug}`),
  ...CV_VARIANTS.flatMap((variant) => [cvPath(variant, CvLocale.En), cvPath(variant, CvLocale.Es)]),
]);

/** q-value of a media range in an Accept header (0 when absent). */
function acceptQuality(header: string, range: string): number {
  for (const part of header.split(",")) {
    const [type, ...params] = part.trim().split(";");
    if (type.trim().toLowerCase() !== range) continue;
    const q = params.map((p) => p.trim()).find((p) => p.startsWith("q="));
    return q ? Number(q.slice(2)) || 0 : 1;
  }
  return 0;
}

/** True only when text/markdown explicitly outranks text/html and the wildcard range. */
function prefersMarkdown(header: string | null): boolean {
  if (!header) return false;
  const md = acceptQuality(header, "text/markdown");
  if (md <= 0) return false;
  const html = acceptQuality(header, "text/html");
  const any = acceptQuality(header, "*/*");
  return md > html && md > any;
}

export function middleware(request: NextRequest) {
  if (!["GET", "HEAD", "OPTIONS"].includes(request.method)) return NextResponse.next();
  const { pathname } = request.nextUrl;

  let contentPath: string | null = null;
  let negotiated = false;
  if (pathname.endsWith(".md")) {
    // Every .md URL goes to the handler; unknown ones get a markdown 404.
    contentPath = pathname.slice(0, -".md".length) || "/";
  } else if (request.method !== "OPTIONS" && CONTENT_ROUTES.has(pathname) && prefersMarkdown(request.headers.get("accept"))) {
    contentPath = pathname === "/" ? "/index" : pathname;
    negotiated = true;
  }
  if (!contentPath) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = `/api/md${contentPath}`;
  const headers = new Headers(request.headers);
  if (negotiated) headers.set("x-md-negotiated", "1");
  const response = NextResponse.rewrite(url, { request: { headers } });
  // Next applies the static page cache profile to rewrites; negotiated
  // answers must stay uncacheable, so set it on the middleware response.
  if (negotiated) response.headers.set("Cache-Control", "no-store");
  return response;
}

export const config = {
  // Everything except the API and framework internals; the allowlist above
  // does the real filtering, so static assets just pass through.
  matcher: ["/((?!api|_next|_vercel).*)"],
};
