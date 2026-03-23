import assert from "node:assert/strict";

/**
 * Assertions de contrato (forma / campos) para payloads y respuestas de simulación.
 */

export function assertSimulationRequestShape(value) {
  assert.ok(value && typeof value === "object", "request debe ser objeto");
  assert.ok(value.persona && typeof value.persona === "object", "persona requerida");
  assert.equal(typeof value.persona.id, "string", "persona.id string");
  assert.ok(value.persona.id.trim(), "persona.id no vacío");
  assert.equal(typeof value.persona.name, "string", "persona.name string");
  assert.equal(typeof value.persona.description, "string", "persona.description string");
  assert.ok(Array.isArray(value.persona.traits), "persona.traits array");
  assert.ok(["low", "medium", "high"].includes(value.persona.frustration), "persona.frustration enum");
  assert.ok(["low", "medium", "high"].includes(value.persona.techLevel), "persona.techLevel enum");
  assert.equal(typeof value.sourceType, "string", "sourceType string");
  assert.equal(typeof value.flowInput, "string", "flowInput string");
  assert.ok(value.flowInput.trim(), "flowInput no vacío");
  assert.equal(typeof value.productContext, "string", "productContext string");
  if (value.language !== undefined) assert.equal(typeof value.language, "string", "language string opcional");
  if (value.seed !== undefined) {
    assert.equal(typeof value.seed, "number", "seed number opcional");
    assert.ok(Number.isInteger(value.seed), "seed entero");
    assert.ok(value.seed >= 0 && value.seed <= 2147483646, "seed en rango Gemini");
  }
}

export function assertSimulationResultShape(value) {
  assert.ok(value && typeof value === "object", "result debe ser objeto");
  assert.equal(typeof value.personaId, "string", "personaId string");
  assert.equal(typeof value.score, "number", "score number");
  assert.equal(typeof value.fit_score, "number", "fit_score number");
  assert.equal(typeof value.fit_note, "string", "fit_note string");
  assert.equal(typeof value.summary, "string", "summary string");
  assert.ok(Array.isArray(value.steps), "steps array");
  assert.ok(Array.isArray(value.issues), "issues array");
  assert.ok(value.wouldReturn === null || typeof value.wouldReturn === "boolean", "wouldReturn bool|null");
  for (const step of value.steps) {
    assert.ok(step && typeof step === "object", "step objeto");
    assert.equal(typeof step.action, "string", "step.action string");
    assert.equal(typeof step.reaction, "string", "step.reaction string");
  }
  for (const issue of value.issues) {
    assert.ok(issue && typeof issue === "object", "issue objeto");
    assert.ok(["critical", "warning", "info"].includes(issue.severity), "issue.severity enum");
    assert.equal(typeof issue.description, "string", "issue.description string");
  }
}

export function assertRepairJsonOutputShape(parsed) {
  assert.equal(typeof parsed.score, "number");
  assert.equal(typeof parsed.fit_score, "number");
  assert.equal(typeof parsed.summary, "string");
  assert.ok(Array.isArray(parsed.steps));
  assert.ok(Array.isArray(parsed.issues));
}
