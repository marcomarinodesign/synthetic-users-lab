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
  geminiRetryDelayMs,
  formatGeminiErrorForClient,
} from "../../../api/simulation-core.js";
import { assertRepairJsonOutputShape } from "../../helpers/contracts.js";

const basePersona = {
  id: "busy-manager",
  name: "Busy Manager",
  description: "Short on time",
  traits: ["Impatient", "Looks for ROI"],
  frustration: "high",
  techLevel: "medium",
};

test("buildUserPrompt: contrato SOURCE + FLOW + idioma", () => {
  const prompt = buildUserPrompt({ sourceType: "url", flowInput: "https://app.example.com", language: "en" });
  assert.match(prompt, /^SOURCE: /m);
  assert.match(prompt, /^FLOW:\n/m);
  assert.ok(prompt.includes("https://app.example.com"));
  assert.ok(prompt.includes("REQUIRED OUTPUT LANGUAGE"));
  assert.ok(prompt.includes("English"));
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
    language: "en",
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

test("repairJSON: normaliza steps/issues inválidos con defaults estables", () => {
  const parsed = repairJSON(
    JSON.stringify({
      score: 6,
      fit_score: 5,
      fit_note: "ok",
      summary: "x",
      steps: [{ action: " click ", reaction: " listo " }, { action: "", reaction: "" }],
      issues: [
        { severity: "oops", category: "unknown", description: "  copy confuso  " },
        { severity: "critical", category: "ui", description: "" },
      ],
      wouldReturn: true,
    })
  );
  assert.equal(parsed.steps.length, 1);
  assert.deepEqual(parsed.steps[0], { action: "click", reaction: "listo" });
  assert.equal(parsed.issues.length, 1);
  assert.deepEqual(parsed.issues[0], {
    severity: "warning",
    category: "ux",
    description: "copy confuso",
    action: undefined,
    component: undefined,
  });
});

test("repairJSON: canonicaliza issues (orden estable + dedupe semántico)", () => {
  const parsed = repairJSON(
    JSON.stringify({
      score: 7,
      fit_score: 7,
      fit_note: "ok",
      summary: "ok",
      steps: [],
      issues: [
        { severity: "info", category: "copy", description: "Texto largo en CTA" },
        { severity: "critical", category: "ux", description: "Confusión en onboarding" },
        { severity: "warning", category: "ui", description: "Contraste bajo" },
        { severity: "critical", category: "ux", description: "confusión en ONBOARDING" },
      ],
      wouldReturn: true,
    })
  );
  assert.equal(parsed.issues.length, 3);
  assert.equal(parsed.issues[0].description, "Confusión en onboarding");
  assert.equal(parsed.issues[1].description, "Contraste bajo");
  assert.equal(parsed.issues[2].description, "Texto largo en CTA");
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

test("repairObjectiveAnalysisJSON: deduplica, normaliza espacios y limita tamaño", () => {
  const elements = Array.from({ length: 30 }, (_, i) => ` item ${i} `);
  const raw = JSON.stringify({
    elements: [...elements, " item 1 "],
    flow: [" paso 1 ", "paso 1"],
    objective_issues: [" issue a ", "issue   a"],
    strengths: [],
    copy_samples: [],
  });
  const o = repairObjectiveAnalysisJSON(raw);
  assert.ok(o);
  assert.equal(o.elements.length, 25);
  assert.equal(o.flow.length, 1);
  assert.deepEqual(o.flow[0], "paso 1");
  assert.equal(o.objective_issues.length, 1);
  assert.deepEqual(o.objective_issues[0], "issue a");
});

test("buildAnchoredUserPrompt: incluye anchor y FLOW", () => {
  const p = buildAnchoredUserPrompt({
    sourceType: "url",
    flowInput: "hello",
    language: "en",
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

test("geminiRetryDelayMs: usa header Retry-After", () => {
  const res = new Response(null, { status: 429, headers: { "Retry-After": "12" } });
  assert.equal(geminiRetryDelayMs(res, "", 0), 12_000);
});

test("geminiRetryDelayMs: parsea retry in Xs del mensaje de error", () => {
  const res = new Response(null, { status: 429 });
  assert.equal(geminiRetryDelayMs(res, "Please retry in 40.172628547s.", 0), 40173);
});

test("formatGeminiErrorForClient: cuota Gemini → mensaje en español", () => {
  const body = JSON.stringify({
    error: { message: "Quota exceeded for metric: generate_content_free_tier_requests" },
  });
  const msg = formatGeminiErrorForClient(429, body);
  assert.ok(msg.includes("Cuota"));
  assert.ok(msg.includes("facturación") || msg.includes("pricing"));
});
