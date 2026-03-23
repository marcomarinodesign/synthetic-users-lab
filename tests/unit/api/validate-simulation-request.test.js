import test from "node:test";
import assert from "node:assert/strict";
import { validateSimulationRequest } from "../../../api/validate-simulation-request.js";
import { assertSimulationRequestShape } from "../../helpers/contracts.js";

const validBody = {
  persona: {
    id: "p1",
    name: "N",
    description: "D",
    traits: ["a"],
    frustration: "low",
    techLevel: "high",
  },
  sourceType: "url",
  flowInput: "https://example.com",
  productContext: "",
  language: "es",
};

test("validateSimulationRequest: body válido cumple contrato", () => {
  const r = validateSimulationRequest(validBody);
  assert.equal(r.ok, true);
  assertSimulationRequestShape(r.value);
});

test("validateSimulationRequest: rechaza sourceType inválido", () => {
  const r = validateSimulationRequest({ ...validBody, sourceType: "invalid" });
  assert.equal(r.ok, false);
});

test("validateSimulationRequest: rechaza flowInput vacío", () => {
  const r = validateSimulationRequest({ ...validBody, flowInput: "   " });
  assert.equal(r.ok, false);
});
