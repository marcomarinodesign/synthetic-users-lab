import test from "node:test";
import assert from "node:assert/strict";
import { normalizeSimulationResult } from "../../../src/domain/simulation.ts";
import { assertSimulationResultShape } from "../../helpers/contracts.js";
import { makeSimulationResult } from "../../factories/simulationResult.js";

test("normalizeSimulationResult: objeto mínimo cumple contrato", () => {
  const raw = makeSimulationResult();
  const out = normalizeSimulationResult(raw, "p-fixed");
  assertSimulationResultShape(out);
  assert.equal(out.personaId, "p-1");
});

test("normalizeSimulationResult: usa personaId de respaldo si falta en datos", () => {
  const raw = { ...makeSimulationResult() };
  delete raw.personaId;
  const out = normalizeSimulationResult(raw, "p-fixed");
  assertSimulationResultShape(out);
  assert.equal(out.personaId, "p-fixed");
});

test("normalizeSimulationResult: datos vacíos devuelven forma estable", () => {
  const out = normalizeSimulationResult(null, "x");
  assertSimulationResultShape(out);
  assert.equal(out.score, 0);
});
