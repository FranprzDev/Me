import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

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

async function assertPdf(url) {
  const response = await fetch(url);
  assert.equal(response.status, 200, `${url} answers 200`);
  assert.match(response.headers.get("content-type") ?? "", /^application\/pdf/, `${url} is a PDF`);
  await response.arrayBuffer();
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
    assert.equal(doc.version.id, version.id, `get_cv returns ${version.id} (${language})`);
    assert.equal(doc.version.pdf_url, version.pdf_url);
    assert.ok(doc.sections.length > 0 && doc.sections.every((section) => section.title), `${version.id} (${language}) has titled sections`);
    await assertPdf(doc.version.pdf_url);
  }

  const full = await callJson("get_cv", { language });
  assert.ok(Array.isArray(full.experience) && full.experience.length > 0, `get_cv without version keeps the full CV (${language})`);
  assert.deepEqual(full.versions.map((version) => version.id), sourceVariants, `get_cv without version lists the versions (${language})`);
}

const unknownVersion = await rpc("tools/call", { name: "get_cv", arguments: { version: "not-a-version" } });
assert.equal(unknownVersion.isError, true, "get_cv rejects a version outside CvVariant");


assert.match(card.skills[0].description, /list_cv_versions/, "Agent card lists list_cv_versions");
assert.match(agentsHtml, /list_cv_versions/, "/for-agents lists list_cv_versions");

const get = await fetch(`${baseUrl}/api/mcp`);
assert.equal(get.status, 405, "Stateless server has no GET stream");

console.log(`Agent card, /for-agents and MCP tools/list + tools/call passed (CV versions: ${sourceVariants.join(", ")}).`);
