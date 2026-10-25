import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { privateClientMentions } from "./client-privacy.mjs";

/**
 * Agent-facing surface: the home links to /for-agents, the old recruiter page
 * redirects, the agent card points to the MCP server, and the MCP server
 * answers tools/list and a real tool call over Streamable HTTP, including the
 * CV versions, which must match the CvVariant enum in src/content/cv/types.ts.
 */
const baseUrl = (process.env.PORTFOLIO_URL || "http://localhost:3000").replace(/\/$/, "");

const home = await (await fetch(baseUrl)).text();
assert.match(home, /href="\/for-agents"/, "Home links to the MCP how-to page");
assert.doesNotMatch(home, /href="\/for-recruiters"/);

const oldRecruiters = await fetch(`${baseUrl}/for-recruiters`, { redirect: "manual" });
assert.equal(oldRecruiters.status, 308, "/for-recruiters redirects permanently");
assert.equal(new URL(oldRecruiters.headers.get("location"), baseUrl).pathname, "/me");

const agentsPage = await fetch(`${baseUrl}/for-agents`);
assert.equal(agentsPage.status, 200);
const agentsHtml = await agentsPage.text();
assert.match(agentsHtml, /\/api\/mcp/, "/for-agents shows the MCP endpoint");
assert.match(agentsHtml, /claude mcp add --transport http/);
assert.match(agentsHtml, /href="https:\/\/chatgpt\.com\/\?q=[^"]+"/, "/for-agents opens ChatGPT with a prompt");
assert.match(agentsHtml, /href="https:\/\/claude\.ai\/new\?q=[^"]+"/, "/for-agents opens Claude with a prompt");
assert.doesNotMatch(agentsHtml, /EmbeddingGemma|Qwen/);

const card = await (await fetch(`${baseUrl}/.well-known/agent-card.json`)).json();
assert.equal(card.url, `${baseUrl}/api/mcp`, "Agent card points to the MCP server");

const legacyA2A = await fetch(`${baseUrl}/api/agent`, { method: "POST", body: "{}" });
assert.equal(legacyA2A.status, 404, "The old A2A endpoint is gone");

let nextId = 1;
async function rpc(method, params) {
  const response = await fetch(`${baseUrl}/api/mcp`, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json, text/event-stream" },
    body: JSON.stringify({ jsonrpc: "2.0", id: nextId++, method, params }),
  });
  assert.equal(response.status, 200, `${method} answers 200`);
  const body = await response.json();
  assert.equal(body.error, undefined, `${method}: ${JSON.stringify(body.error)}`);
  return body.result;
}

const init = await rpc("initialize", {
  protocolVersion: "2025-06-18",
  capabilities: {},
  clientInfo: { name: "portfolio-ci", version: "1.0.0" },
});
assert.equal(init.serverInfo.name, "francisco-perez-portfolio");

const { tools } = await rpc("tools/list", {});
const names = tools.map((tool) => tool.name).sort();
assert.deepEqual(names, ["get_contact", "get_cv", "get_experience", "get_profile", "get_project", "list_cv_versions", "list_projects"]);
assert.ok(tools.every((tool) => tool.annotations?.readOnlyHint === true), "Every tool is read-only");

const hackathons = await rpc("tools/call", { name: "get_project", arguments: { slug: "hackathons", language: "es" } });
const project = JSON.parse(hackathons.content[0].text);
assert.equal(project.slug, "hackathons");
assert.ok(project.entries.some((entry) => entry.name.startsWith("ExoGames")), "Real data comes back");

const contact = JSON.parse((await rpc("tools/call", { name: "get_contact", arguments: {} })).content[0].text);
assert.equal(contact.email, "franciscoperezdeveloper@gmail.com");

// CV versions: the source of truth is the CvVariant enum the /cv pages are built from.
const typesSource = await readFile(new URL("../src/content/cv/types.ts", import.meta.url), "utf8");
const enumBody = typesSource.match(/export enum CvVariant \{([^}]*)\}/);
assert.ok(enumBody, "CvVariant enum found in src/content/cv/types.ts");
const sourceVariants = [...enumBody[1].matchAll(/=\s*"([^"]+)"/g)].map((match) => match[1]);
assert.ok(sourceVariants.length > 0, "CvVariant has members");

const callJson = async (name, args) => JSON.parse((await rpc("tools/call", { name, arguments: args })).content[0].text);

const pdfManifest = JSON.parse(await readFile(new URL("../public/cv/files/manifest.json", import.meta.url), "utf8"));

/** pdf_url must carry the current manifest version, so agents never hand out a cached old PDF. */
function assertVersionedPdfUrl(url, id, language) {
  const parsed = new URL(url);
  const file = `francisco-perez-cv-${id}-${language}.pdf`;
  const entry = pdfManifest.files.find((item) => item.file === file);
  assert.ok(entry, `${file} is in the manifest`);
  assert.equal(parsed.pathname, `/cv/files/${file}`, `${id} (${language}) pdf_url path`);
  assert.equal(parsed.searchParams.get("v"), entry.version, `${id} (${language}) pdf_url carries the manifest version`);
}

async function assertPdf(url) {
  const response = await fetch(url);
  assert.equal(response.status, 200, `${url} answers 200`);
  assert.match(response.headers.get("content-type") ?? "", /^application\/pdf/, `${url} is a PDF`);
  await response.arrayBuffer();
}

// The profile's CV link is the generated Applied AI PDF at its current manifest version.
for (const language of ["en", "es"]) {
  const profile = JSON.parse((await rpc("tools/call", { name: "get_profile", arguments: { language } })).content[0].text);
  assertVersionedPdfUrl(profile.links.cv_pdf, "applied-ai", language);
  await assertPdf(profile.links.cv_pdf);
}

for (const language of ["en", "es"]) {
  const prefix = language === "es" ? "/es" : "";
  const list = await callJson("list_cv_versions", { language });
  assert.deepEqual(list.versions.map((version) => version.id), sourceVariants, `list_cv_versions (${language}) matches CvVariant`);
  for (const version of list.versions) {
    assert.ok(version.name && version.headline, `${version.id} (${language}) has a name and headline`);
    assert.equal(new URL(version.page_url).pathname, `${prefix}/cv/${version.id}`);
    const page = await fetch(version.page_url);
    assert.equal(page.status, 200, `${version.page_url} answers 200`);
    await page.arrayBuffer();

    const doc = await callJson("get_cv", { language, version: version.id });
    assert.equal(privateClientMentions(JSON.stringify(doc)), 0, `get_cv ${version.id} (${language}) names no private client`);
    assert.equal(doc.version.id, version.id, `get_cv returns ${version.id} (${language})`);
    assert.equal(doc.version.pdf_url, version.pdf_url);
    assertVersionedPdfUrl(doc.version.pdf_url, version.id, language);
    assert.ok(doc.sections.length > 0 && doc.sections.every((section) => section.title), `${version.id} (${language}) has titled sections`);
    await assertPdf(doc.version.pdf_url);
  }

  const full = await callJson("get_cv", { language });
  assert.equal(privateClientMentions(JSON.stringify(full)), 0, `get_cv (${language}) names no private client`);
  const experience = await callJson("get_experience", { language });
  assert.equal(privateClientMentions(JSON.stringify(experience)), 0, `get_experience (${language}) names no private client`);
  assert.ok(Array.isArray(full.experience) && full.experience.length > 0, `get_cv without version keeps the full CV (${language})`);
  assert.deepEqual(full.versions.map((version) => version.id), sourceVariants, `get_cv without version lists the versions (${language})`);
}

const unknownVersion = await rpc("tools/call", { name: "get_cv", arguments: { version: "not-a-version" } });
assert.equal(unknownVersion.isError, true, "get_cv rejects a version outside CvVariant");


assert.match(card.skills[0].description, /list_cv_versions/, "Agent card lists list_cv_versions");
assert.match(agentsHtml, /list_cv_versions/, "/for-agents lists list_cv_versions");

const get = await fetch(`${baseUrl}/api/mcp`);
assert.equal(get.status, 405, "Stateless server has no GET stream");
const del = await fetch(`${baseUrl}/api/mcp`, { method: "DELETE" });
assert.equal(del.status, 405, "Stateless server has no session to delete");

// Hardening (agent/mcp-hardening): capabilities, facts from src/content/cv, invalid args,
// CORS, lenient Accept, body cap, llms.txt and the copy-paste configs.
assert.equal(init.capabilities.tools?.listChanged, false, "A fixed, stateless tool set does not advertise listChanged");

for (const language of ["en", "es"]) {
  const profile = await callJson("get_profile", { language });
  const list = await callJson("list_cv_versions", { language });
  const primary = list.versions.find((version) => version.id === "applied-ai");
  assert.ok(primary.headline.startsWith(profile.title), `get_profile title (${language}) is the primary CV headline's role`);
  const full = await callJson("get_cv", { language });
  const primaryDoc = await callJson("get_cv", { language, version: "applied-ai" });
  const cvEducation = primaryDoc.sections.find((section) => section.id === "education").entries;
  assert.deepEqual(
    full.education.map((entry) => entry.period),
    cvEducation.map((entry) => entry.period),
    `get_cv education (${language}) matches src/content/cv`,
  );
}

for (const args of [{ slug: "not-a-world" }, {}]) {
  const result = await rpc("tools/call", { name: "get_project", arguments: args });
  assert.equal(result.isError, true, `get_project rejects ${JSON.stringify(args)}`);
}
const unknownTool = await rpc("tools/call", { name: "not_a_tool", arguments: {} });
assert.equal(unknownTool.isError, true, "Unknown tools answer an error result");

const browserOrigin = "https://inspector.example";
const preflight = await fetch(`${baseUrl}/api/mcp`, {
  method: "OPTIONS",
  headers: {
    origin: browserOrigin,
    "access-control-request-method": "POST",
    "access-control-request-headers": "content-type, accept, mcp-protocol-version",
  },
});
assert.equal(preflight.status, 204, "CORS preflight answers 204");
assert.equal(preflight.headers.get("access-control-allow-origin"), "*");
assert.match(preflight.headers.get("access-control-allow-headers") ?? "", /Mcp-Protocol-Version/i);
assert.match(preflight.headers.get("access-control-allow-methods") ?? "", /POST/);

async function post(body, headers) {
  return fetch(`${baseUrl}/api/mcp`, {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}
const ping = { jsonrpc: "2.0", id: 99, method: "ping" };

const corsPost = await post(ping, { origin: browserOrigin, accept: "application/json, text/event-stream" });
assert.equal(corsPost.status, 200);
assert.equal(corsPost.headers.get("access-control-allow-origin"), "*", "MCP responses carry CORS headers");
await corsPost.arrayBuffer();

for (const accept of ["application/json", "*/*", undefined]) {
  const response = await post(ping, accept ? { accept } : {});
  assert.equal(response.status, 200, `Accept ${accept ?? "(none)"} is served`);
  assert.deepEqual((await response.json()).result, {}, `ping with Accept ${accept ?? "(none)"}`);
}

const oversized = await post({ ...ping, params: { padding: "x".repeat(70 * 1024) } }, { accept: "application/json, text/event-stream" });
assert.equal(oversized.status, 413, "Bodies over 64 KiB are rejected");
await oversized.arrayBuffer();

const malformed = await post("{not json", { accept: "application/json, text/event-stream" });
assert.equal(malformed.status, 400, "Malformed JSON is a 400");
assert.equal((await malformed.json()).error.code, -32700, "Malformed JSON is a JSON-RPC parse error");

assert.equal(card.mcp.endpoint, `${baseUrl}/api/mcp`);
assert.deepEqual([...card.mcp.tools].sort(), names, "Agent card lists the same tools as tools/list");
assert.equal(card.mcp.serverInfo.version, init.serverInfo.version, "Agent card and initialize report the same server version");

const llms = await fetch(`${baseUrl}/llms.txt`);
assert.equal(llms.status, 200, "llms.txt is served");
assert.match(llms.headers.get("content-type") ?? "", /^text\/plain/);
const llmsText = await llms.text();
assert.ok(llmsText.includes(`${baseUrl}/api/mcp`), "llms.txt points to the MCP endpoint");
for (const name of names) assert.ok(llmsText.includes(`- ${name}:`), `llms.txt lists ${name}`);
for (const version of (await callJson("list_cv_versions", { language: "en" })).versions) {
  assert.ok(llmsText.includes(version.pdf_url), `llms.txt links the ${version.id} PDF`);
}

for (const [surface, text] of [["home", home], ["/for-agents", agentsHtml], ["agent card", JSON.stringify(card)], ["llms.txt", llmsText]]) {
  assert.equal(privateClientMentions(text), 0, `${surface} names no private client`);
}

const endpoint = `${baseUrl}/api/mcp`;
const decode = (html) => html.replace(/&quot;/g, '"').replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#x27;/g, "'");
const codeBlocks = [...agentsHtml.matchAll(/<code>([\s\S]*?)<\/code>/g)].map((match) => decode(match[1].replace(/<[^>]+>/g, "")));
const configs = codeBlocks.filter((block) => block.trim().startsWith("{")).map((block) => JSON.parse(block));
assert.deepEqual(configs.find((config) => config.mcpServers)?.mcpServers["francisco-perez"], { type: "http", url: endpoint }, "mcpServers config");
assert.deepEqual(configs.find((config) => config.servers)?.servers["francisco-perez"], { type: "http", url: endpoint }, "VS Code mcp.json config");
assert.ok(codeBlocks.includes(`claude mcp add --transport http francisco-perez ${endpoint}`), "Claude Code command uses this deployment");
assert.ok(
  codeBlocks.includes(`npx @modelcontextprotocol/inspector --cli ${endpoint} --transport http --method tools/list`),
  "Inspector command uses this deployment",
);
assert.doesNotMatch(codeBlocks.join("\n"), /github\.io/, "Configs never point to the old GitHub Pages host");

// Rate limit: a client over the limit gets 429 + Retry-After, another client is unaffected.
// A dedicated x-forwarded-for keeps this burst from counting against the checks above.
const burstHeaders = { "content-type": "application/json", accept: "application/json, text/event-stream", "x-forwarded-for": "203.0.113.77" };
const burstBody = JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list", params: {} });
let limited = null;
let served = 0;
for (let i = 0; i < 200 && !limited; i += 1) {
  const response = await fetch(endpoint, { method: "POST", headers: burstHeaders, body: burstBody });
  if (response.status === 429) limited = response;
  else {
    assert.equal(response.status, 200, "Requests under the limit are served");
    served += 1;
  }
}
assert.ok(limited, "A burst of requests from one client is rate limited");
assert.ok(served >= 60, `A normal session fits well under the limit (served ${served})`);
assert.ok(Number(limited.headers.get("retry-after")) >= 1, "429 carries Retry-After");
assert.equal(limited.headers.get("access-control-allow-origin"), "*", "429 keeps CORS so browser clients can read it");
assert.equal((await limited.json()).error.message, "Too many requests. Retry later.");
const otherClient = await fetch(endpoint, { method: "POST", headers: { ...burstHeaders, "x-forwarded-for": "203.0.113.78" }, body: burstBody });
assert.equal(otherClient.status, 200, "A different client is not affected by the limit");

console.log(`Agent card, /for-agents and MCP tools/list + tools/call passed (CV versions: ${sourceVariants.join(", ")}).`);
