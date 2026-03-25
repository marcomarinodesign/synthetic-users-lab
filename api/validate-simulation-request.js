import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const enums = JSON.parse(readFileSync(join(__dirname, "../src/domain/simulation.enums.json"), "utf8"));

const SOURCE_TYPES = new Set(enums.sourceTypes);

/**
 * Validación runtime del body de POST /api/simulate.
 * Mantener alineado con `SimulationRequest` en `src/domain/simulation.ts`.
 * @returns {{ ok: true, value: object } | { ok: false, error: string }}
 */
export function validateSimulationRequest(body) {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Body inválido" };
  }

  const { persona, sourceType, flowInput, productContext, language, seed, analysisMode } = body;

  if (!persona || typeof persona !== "object") {
    return { ok: false, error: "Missing persona" };
  }

  const id = persona.id;
  const name = persona.name;
  const description = persona.description;
  if (typeof id !== "string" || !id.trim()) {
    return { ok: false, error: "Invalid persona.id" };
  }
  if (typeof name !== "string" || !name.trim()) {
    return { ok: false, error: "Invalid persona.name" };
  }
  if (typeof description !== "string") {
    return { ok: false, error: "Invalid persona.description" };
  }
  if (!Array.isArray(persona.traits)) {
    return { ok: false, error: "Invalid persona.traits" };
  }
  const fr = persona.frustration;
  const tl = persona.techLevel;
  if (fr !== "low" && fr !== "medium" && fr !== "high") {
    return { ok: false, error: "Invalid persona.frustration" };
  }
  if (tl !== "low" && tl !== "medium" && tl !== "high") {
    return { ok: false, error: "Invalid persona.techLevel" };
  }

  if (typeof sourceType !== "string" || !SOURCE_TYPES.has(sourceType)) {
    return { ok: false, error: "Invalid sourceType" };
  }

  if (typeof flowInput !== "string" || !flowInput.trim()) {
    return { ok: false, error: "Missing flowInput" };
  }

  if (typeof productContext !== "string") {
    return { ok: false, error: "Invalid productContext" };
  }

  if (language !== undefined && typeof language !== "string") {
    return { ok: false, error: "Invalid language" };
  }

  if (seed !== undefined) {
    if (typeof seed !== "number" || !Number.isInteger(seed) || seed < 0 || seed > 2147483646) {
      return { ok: false, error: "Invalid seed" };
    }
  }

  if (analysisMode !== undefined) {
    if (analysisMode !== "fast" && analysisMode !== "max") {
      return { ok: false, error: "Invalid analysisMode" };
    }
  }

  return {
    ok: true,
    value: {
      persona: {
        id: id.trim(),
        name: name.trim(),
        description,
        traits: persona.traits.map((t) => String(t)),
        frustration: fr,
        techLevel: tl,
      },
      sourceType,
      flowInput: flowInput.trim(),
      productContext,
      language: typeof language === "string" ? language : "en",
      analysisMode: analysisMode === "fast" ? "fast" : "max",
      ...(seed !== undefined ? { seed } : {}),
    },
  };
}
