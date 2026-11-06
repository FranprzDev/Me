/**
 * QA for the markdown endpoints (src/lib/md, src/middleware.ts).
 * Run with the production server up: `pnpm build && pnpm start`, then
 * `node scripts/check-markdown.mjs [baseUrl]`. Exits non-zero on failure.
 */
const base = process.argv[2] || "http://localhost:3000";
let failures = 0;

function check(name, ok, detail = "") {
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${detail ? ` — ${detail}` : ""}`);
  if (!ok) failures += 1;
}

async function get(path, headers = {}) {
  const response = await fetch(`${base}${path}`, { headers, redirect: "manual" });
  return { status: response.status, headers: response.headers, body: await response.text() };
}

const mdHeaders = async (r, name) => {
  check(`${name}: status 200`, r.status === 200, `got ${r.status}`);
  check(`${name}: content-type markdown`, (r.headers.get("content-type") || "").includes("text/markdown"));
  check(`${name}: x-markdown-tokens`, Number(r.headers.get("x-markdown-tokens")) > 0);
  check(`${name}: link canonical`, (r.headers.get("link") || "").includes('rel="canonical"'));
  check(`${name}: varies on accept`, (r.headers.get("vary") || "").toLowerCase().includes("accept"));
  check(`${name}: edge cache`, (r.headers.get("cache-control") || "").includes("s-maxage"));
  check(`${name}: not empty`, r.body.trim().length > 200, `${r.body.trim().length} chars`);
};

// .md endpoints serve real content
mdHeaders(await get("/index.md"), "index.md");
mdHeaders(await get("/me.md"), "me.md");
mdHeaders(await get("/for-agents.md"), "for-agents.md");
mdHeaders(await get("/cv.md"), "cv.md");
mdHeaders(await get("/es/cv/fullstack.md"), "es cv fullstack");
const home = await get("/index.md");
check("index.md names Francisco", /Francisco/i.test(home.body));
const me = await get("/me.md");
check("me.md has experience section", /Experience|experience/i.test(me.body));
check("me.md never leaks a phone", !/\+54\s?9?\s?381/.test(me.body));

// HEAD answers headers without a body
const head = await fetch(`${base}/me.md`, { method: "HEAD" });
check("HEAD me.md 200 with token header", head.status === 200 && Number(head.headers.get("x-markdown-tokens")) > 0);

// OPTIONS preflight
const opt = await fetch(`${base}/me.md`, { method: "OPTIONS" });
check("OPTIONS 204", opt.status === 204, `got ${opt.status}`);

// Content negotiation
const neg = await get("/me", { accept: "text/markdown" });
check("Accept markdown negotiates", (neg.headers.get("content-type") || "").includes("text/markdown"));
const star = await get("/me", { accept: "*/*" });
check("*/* stays HTML", (star.headers.get("content-type") || "").includes("text/html"));
const plain = await get("/me");
check("no Accept stays HTML", (plain.headers.get("content-type") || "").includes("text/html"));
const lower = await get("/me", { accept: "text/markdown;q=0.5, text/html" });
check("markdown q<html stays HTML", (lower.headers.get("content-type") || "").includes("text/html"));
const mixed = await get("/me", { accept: "text/html;q=0.5, text/markdown" });
check("markdown outranks html -> markdown", (mixed.headers.get("content-type") || "").includes("text/markdown"));
const negCache = await get("/me", { accept: "text/markdown" });
check("negotiated answer is no-store", (negCache.headers.get("cache-control") || "").includes("no-store"));

// Unknown and out-of-scope paths
const missing = await get("/nope.md");
check("unknown .md 404 markdown", missing.status === 404 && (missing.headers.get("content-type") || "").includes("text/markdown"));
const sitemapMd = await get("/sitemap.xml.md");
check("sitemap.xml.md not hijacked", sitemapMd.status === 404);
const apiNegotiated = await get("/api/mcp", { accept: "text/markdown", method: "GET" });
check("api routes never negotiate", ![200].includes(apiNegotiated.status) || !(apiNegotiated.headers.get("content-type") || "").includes("text/markdown"));

// Catalog
const catalog = await get("/api/md/_catalog");
check("catalog lists routes", catalog.status === 200 && catalog.body.includes("/me.md"));

// llms-full + ai.txt
const full = await get("/llms-full.txt");
check("llms-full 200 markdown", full.status === 200 && (full.headers.get("content-type") || "").includes("text/markdown"));
check("llms-full covers CVs", full.body.includes("CV"));
const ai = await get("/ai.txt");
check("ai.txt 200", ai.status === 200 && ai.body.includes("robots.txt"));

console.log(failures ? `\n${failures} FAILURES` : "\nAll markdown checks passed");
process.exit(failures ? 1 : 0);
