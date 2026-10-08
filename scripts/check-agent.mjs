import assert from "node:assert/strict";

const baseUrl = (process.env.PORTFOLIO_URL || "http://localhost:3000").replace(/\/$/, "");
const homeResponse = await fetch(baseUrl);
assert.equal(homeResponse.status, 200);
const home = await homeResponse.text();
assert.doesNotMatch(home, /Contact me/);
assert.doesNotMatch(home, /Soy un agente y quiero contratarte/);
assert.doesNotMatch(home, /Have a process to automate/);
assert.doesNotMatch(home, /I want to hire you/);
assert.match(home, /href="\/for-recruiters"/);

const agentPage = await fetch(`${baseUrl}/for-recruiters`);
assert.equal(agentPage.status, 200);
const agentHtml = await agentPage.text();
assert.match(agentHtml, /PDF o DOCX/);
assert.match(agentHtml, /EmbeddingGemma 2/);
assert.match(agentHtml, /no se envían a mi servidor/);
assert.match(agentHtml, /¿Este puesto es un buen match\?/);

const oldRoute = await fetch(`${baseUrl}/for-agents`, { redirect: "manual" });
assert.equal(oldRoute.status, 308);
assert.equal(oldRoute.headers.get("location"), "/for-recruiters");

const cardResponse = await fetch(`${baseUrl}/.well-known/agent-card.json`);
assert.equal(cardResponse.status, 200);
const card = await cardResponse.json();
assert.equal(card.protocolVersion, "0.3.0");
assert.equal(card.url, `${baseUrl}/api/agent`);

const response = await fetch(card.url, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    jsonrpc: "2.0",
    id: "portfolio-check",
    method: "message/send",
    params: {
      message: {
        messageId: "visitor-check",
        role: "user",
        parts: [{ kind: "text", text: "¿Por qué contratar a Francisco en Tucumán?" }],
      },
    },
  }),
});
assert.equal(response.status, 200);
const result = await response.json();
assert.equal(result.id, "portfolio-check");
assert.equal(result.result.kind, "message");
assert.match(result.result.parts[0].text, /NASA Space Apps/);
assert.match(result.result.parts[0].text, /Compare its requirements against only the verified portfolio evidence/);
assert.match(result.result.parts[0].text, /¿Por qué contratar a Francisco en Tucumán\?/);
assert.match(result.result.parts[0].text, /Google Calendar no está conectado/);

console.log("Agent card discovery and A2A message exchange passed.");
