/**
 * HTTP helpers for the markdown views of the site (src/lib/md/registry.ts).
 * Every markdown response is a noindex alternate of its HTML page: agents get
 * cheap text, Google keeps indexing the HTML canonical.
 */

export const MARKDOWN_CONTENT_TYPE = "text/markdown; charset=utf-8";

type MarkdownResponseOptions = {
  /** Canonical path of the HTML page this markdown mirrors (e.g. "/me"). */
  canonicalPath: string;
  /** Request origin, used to build absolute Content-Location / Link URLs. */
  origin: string;
  /** True when the response comes from Accept negotiation (no-store). */
  negotiated?: boolean;
  /** Cache profile: "page" for content pages, "full" for llms-full.txt. */
  cache?: "page" | "full";
};

function absolute(origin: string, path: string): string {
  return new URL(path, `${origin}/`).toString();
}

/** Approximate token count, as advertised by X-Markdown-Tokens (chars/4). */
function approxTokens(body: string): number {
  return Math.ceil(body.length / 4);
}

export function markdownResponse(body: string, options: MarkdownResponseOptions): Response {
  const canonicalUrl = absolute(options.origin, options.canonicalPath);
  // Negotiated answers are never stored; .md URLs get a short edge cache.
  const cacheControl = options.negotiated
    ? "no-store"
    : options.cache === "full"
      ? "public, s-maxage=86400, stale-while-revalidate=604800"
      : "public, s-maxage=3600, stale-while-revalidate=86400";
  const headers: Record<string, string> = {
    "Content-Type": MARKDOWN_CONTENT_TYPE,
    "X-Markdown-Tokens": String(approxTokens(body)),
    "X-Robots-Tag": "noindex, follow",
    "Content-Location": canonicalUrl,
    Link: `<${canonicalUrl}>; rel="canonical"`,
    "Cache-Control": cacheControl,
    Vary: "Accept",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
  };
  return new Response(body, { headers });
}

/** Markdown 404: the markdown endpoint never answers HTML. */
export function markdownNotFound(path: string, origin: string): Response {
  const body = [`# Not found`, "", `No markdown version exists for \`${path}\`.`, "", `See ${absolute(origin, "/llms.txt")} for the site map.`, ""].join("\n");
  return new Response(body, {
    status: 404,
    headers: {
      "Content-Type": MARKDOWN_CONTENT_TYPE,
      "X-Robots-Tag": "noindex, follow",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

export function markdownPreflight(): Response {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
      "Access-Control-Max-Age": "86400",
    },
  });
}
