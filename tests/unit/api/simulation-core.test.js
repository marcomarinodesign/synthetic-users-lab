import test from "node:test";
import assert from "node:assert/strict";

import {
  buildSystemPrompt,
  buildUserPrompt,
  buildAnchoredUserPrompt,
  repairJSON,
  repairObjectiveAnalysisJSON,
  flowPersonaSeed,
  phaseSeed,
  ISSUE_SEVERITIES,
  ISSUE_CATEGORIES,
  ISSUES_SCHEMA,
} from "../../../api/simulation-core.js";
import { assertRepairJsonOutputShape } from "../../helpers/contracts.js";

const basePersona = {
  id: "busy-manager",
  name: "Manager Ocupado",
  description: "Tiene poco tiempo",
  traits: ["Impaciente", "Busca ROI"],
  frustration: "high",
  techLevel: "medium",
};

test("buildUserPrompt: contrato SOURCE + FLOW + idioma", () => {
  const prompt = buildUserPrompt({ sourceType: "url", flowInput: "https://app.example.com", language: "es" });
  assert.match(prompt, /^SOURCE: /m);
  assert.match(prompt, /^FLOW:\n/m);
  assert.ok(prompt.includes("https://app.example.com"));
  assert.ok(prompt.includes("REQUIRED OUTPUT LANGUAGE"));
});

test("buildUserPrompt: refuerza idioma distinto del FLOW", () => {
  const prompt = buildUserPrompt({ sourceType: "url", flowInput: "https://app.example.com", language: "de" });
  assert.ok(prompt.includes("Deutsch"));
  assert.ok(prompt.includes("IGNORE"));
});

test("buildSystemPrompt: incluye regla de idioma (language)", () => {
  const prompt = buildSystemPrompt({
    persona: basePersona,
    productContext: "Tool para onboarding",
    language: "fr",
  });
  assert.ok(prompt.includes("PRIMARY OUTPUT LANGUAGE"));
  assert.ok(prompt.includes("français"));
});

test("buildSystemPrompt: variante expert cuando id está en EXPERT", () => {
  const prompt = buildSystemPrompt({
    persona: { ...basePersona, id: "ux-researcher", name: "UX Researcher" },
    productContext: "",
    language: "es",
  });
  assert.ok(prompt.includes("PROFESSIONAL EVALUATION"));
});

test("repairJSON: JSON válido cumple contrato de salida", () => {
  const parsed = repairJSON(
    '{"score":8,"fit_score":7,"fit_note":"ok","summary":"bien","steps":[],"issues":[],"wouldReturn":true}'
  );
  assertRepairJsonOutputShape(parsed);
  assert.equal(parsed.score, 8);
  assert.equal(parsed.wouldReturn, true);
});

test("repairJSON: entrada rota sigue devolviendo forma estable", () => {
  const parsed = repairJSON('{"score":9,"summary":"texto cortado');
  assertRepairJsonOutputShape(parsed);
  assert.equal(parsed.score, 9);
});

test("ISSUES_SCHEMA alineado con enums de severidad y categoría", () => {
  for (const s of ISSUE_SEVERITIES) {
    assert.match(ISSUES_SCHEMA, new RegExp(`\\b${s}\\b`));
  }
  for (const c of ISSUE_CATEGORIES) {
    assert.match(ISSUES_SCHEMA, new RegExp(`\\b${c}\\b`));
  }
});

test("flowPersonaSeed: determinista para misma entrada", () => {
  const a = flowPersonaSeed("https://x.com", "p1");
  const b = flowPersonaSeed("https://x.com", "p1");
  const c = flowPersonaSeed("https://y.com", "p1");
  assert.equal(a, b);
  assert.notEqual(a, c);
  assert.ok(a >= 0 && a < 2147483647);
});

test("phaseSeed: fases distintas", () => {
  const base = 1000;
  assert.equal(phaseSeed(base, 0), 1000);
  assert.equal(phaseSeed(base, 1), 1001);
});

test("repairObjectiveAnalysisJSON: parsea JSON válido", () => {
  const raw = '{"elements":["a"],"flow":["1"],"objective_issues":["x"],"strengths":[],"copy_samples":[]}';
  const o = repairObjectiveAnalysisJSON(raw);
  assert.ok(o);
  assert.deepEqual(o.elements, ["a"]);
  assert.deepEqual(o.objective_issues, ["x"]);
});

test("repairObjectiveAnalysisJSON: null si vacío", () => {
  assert.equal(repairObjectiveAnalysisJSON("{}"), null);
  assert.equal(repairObjectiveAnalysisJSON(""), null);
});

test("buildAnchoredUserPrompt: incluye anchor y FLOW", () => {
  const p = buildAnchoredUserPrompt({
    sourceType: "url",
    flowInput: "hello",
    language: "es",
    objectiveAnalysis: {
      elements: ["e1"],
      flow: ["f1"],
      objective_issues: ["i1"],
      strengths: [],
      copy_samples: [],
    },
  });
  assert.ok(p.includes("SOURCE:"));
  assert.ok(p.includes("hello"));
  assert.ok(p.includes("OBJECTIVE ANCHOR"));
  assert.ok(p.includes('"elements":["e1"]'));
});
