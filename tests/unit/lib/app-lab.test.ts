import test from "node:test";
import assert from "node:assert/strict";
import {
  aggregateSimulationResults,
  buildCustomPersonaFromForm,
  canAddPersonaSelection,
  countSelectionByCategory,
  personaSelectionLabel,
  validateCustomPersonaForm,
} from "../../../src/lib/app-lab.ts";
import { makePersonaWithCategory } from "../../factories/persona.js";
import { makeSimulationResult } from "../../factories/simulationResult.js";
import { translationsStubEn } from "../../fixtures/translations-stub.js";

test("canAddPersonaSelection permite hasta 3", () => {
  assert.equal(canAddPersonaSelection(0), true);
  assert.equal(canAddPersonaSelection(2), true);
  assert.equal(canAddPersonaSelection(3), false);
});

test("countSelectionByCategory cuenta simple y pro", () => {
  const personas = [
    makePersonaWithCategory("a", "simple"),
    makePersonaWithCategory("b", "simple"),
    makePersonaWithCategory("c", "pro"),
  ];
  const { simpleCount, proCount, totalSelected } = countSelectionByCategory(personas, ["a", "c"]);
  assert.equal(simpleCount, 1);
  assert.equal(proCount, 1);
  assert.equal(totalSelected, 2);
});

test("personaSelectionLabel usa selectAtLeastOne cuando total 0", () => {
  const text = personaSelectionLabel(translationsStubEn, 0, 0, 0);
  assert.equal(text, translationsStubEn.selectAtLeastOne);
});

test("validateCustomPersonaForm devuelve errores si faltan campos", () => {
  const err = validateCustomPersonaForm({ name: "", description: "x", traits: "" }, translationsStubEn);
  assert.equal(err.name, translationsStubEn.validationNameRequired);
});

test("buildCustomPersonaFromForm construye persona con traits", () => {
  const p = buildCustomPersonaFromForm(
    { name: "Ana López", description: "Desc", traits: "a, b" },
    "simple",
    "id-1"
  );
  assert.equal(p.id, "id-1");
  assert.equal(p.category, "simple");
  assert.deepEqual(p.traits, ["a", "b"]);
});

test("aggregateSimulationResults agrega métricas", () => {
  const results = [
    makeSimulationResult({ score: 8, issues: [{ severity: "critical", description: "x" }] }),
    makeSimulationResult({ score: 6, wouldReturn: false, issues: [] }),
  ];
  const m = aggregateSimulationResults(results);
  assert.equal(m.avgFormatted, "7.0");
  assert.equal(m.issueCount, 1);
  assert.equal(m.critCount, 1);
  assert.equal(m.retainCount, 1);
});
