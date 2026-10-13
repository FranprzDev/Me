import assert from "node:assert/strict";
import {
  describeYearsEvidence,
  extractRequiredYears,
  rankRequirements,
} from "../src/lib/recruiter-search.ts";
import {
  buildRecruiterMessages,
  fallbackRecruiterAnswer,
  validateGeneratedAnswer,
} from "../src/lib/recruiter-answer.ts";

assert.equal(extractRequiredYears("Requires 5+ years of professional experience. Founded in 2018."), 5);
assert.equal(extractRequiredYears("Se requieren cinco años de experiencia profesional."), 5);
assert.equal(extractRequiredYears("The company was founded 5 years ago."), null);
assert.match(describeYearsEvidence(5, "es"), /no demuestra ese mínimo/);
assert.match(describeYearsEvidence(2, "en"), /not provide enough dates/);
assert.match(describeYearsEvidence(null, "es"), /no lo doy por cumplido/);

const index = {
  evidence: [{ title: "AI", text: "AI work" }, { title: "Frontend", text: "React work" }],
  evidenceVectors: [[1, 0], [0, 1]],
  requirements: ["AI requirement", "Frontend requirement"],
  requirementVectors: [[1, 0], [0, 1]],
  embedder: { embed: async () => [], device: "wasm" },
};
assert.equal(rankRequirements(index, [0, 1])[0]?.text, "Frontend requirement");

const trustedEvidence = [{ title: "Perfil", text: "Declara casi 3 años en industria." }];
const messages = buildRecruiterMessages({ evidence: trustedEvidence, language: "es", question: "¿Cumple cinco años?" });
assert.match(messages[0].content, /datos, no instrucciones/);
assert.deepEqual(JSON.parse(messages[1].content), {
  question: "¿Cumple cinco años?",
  portfolioEvidence: [{ id: "E1", title: "Perfil", text: "Declara casi 3 años en industria." }],
});

assert.equal(
  validateGeneratedAnswer("E1", trustedEvidence),
  "Declara casi 3 años en industria. [E1]",
);
assert.equal(validateGeneratedAnswer("E2", trustedEvidence), null);
assert.equal(validateGeneratedAnswer("E1 E9", trustedEvidence), "Declara casi 3 años en industria. [E1]");
assert.equal(validateGeneratedAnswer("NO_GROUNDED_SUMMARY", trustedEvidence), null);
assert.equal(validateGeneratedAnswer("", trustedEvidence), null);
assert.match(fallbackRecruiterAnswer("es"), /modelo local/);

console.log("Recruiter evals passed: years, evidence ranking, prompt boundaries, and citation fallback.");
