import assert from "node:assert/strict";

/**
 * Agent-facing surface: the home links to /for-agents, the old recruiter page
 * redirects, the agent card points to the MCP server, and the MCP server
 * answers tools/list and a real tool call over Streamable HTTP.
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
assert.deepEqual(names, ["get_contact", "get_cv", "get_experience", "get_profile", "get_project", "list_projects"]);
assert.ok(tools.every((tool) => tool.annotations?.readOnlyHint === true), "Every tool is read-only");

const hackathons = await rpc("tools/call", { name: "get_project", arguments: { slug: "hackathons", language: "es" } });
const project = JSON.parse(hackathons.content[0].text);
assert.equal(project.slug, "hackathons");
assert.ok(project.entries.some((entry) => entry.name.startsWith("ExoGames")), "Real data comes back");

const contact = JSON.parse((await rpc("tools/call", { name: "get_contact", arguments: {} })).content[0].text);
assert.equal(contact.email, "franciscoperezdeveloper@gmail.com");

const get = await fetch(`${baseUrl}/api/mcp`);
assert.equal(get.status, 405, "Stateless server has no GET stream");

console.log("Agent card, /for-agents and MCP tools/list + tools/call passed.");
