import type { Persona, SimulationResult, SourceType } from "@/types";
import type { SimulationRequest } from "@/domain/simulation";
import { normalizeSimulationResult } from "@/domain/simulation";

export async function fetchUrlContent(url: string): Promise<string> {
  const response = await fetch("/api/fetch-content", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
  if (!response.ok) {
    const err = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error || `HTTP ${response.status}`);
  }
  const data = (await response.json()) as { content: string };
  return data.content;
}

async function postSimulate(body: SimulationRequest): Promise<unknown> {
  const response = await fetch("/api/simulate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const err = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error || `API ${response.status}`);
  }
  return response.json();
}

export async function simulatePersona(
  persona: Persona,
  sourceType: SourceType,
  flowInput: string,
  productContext: string,
  language = "es"
): Promise<SimulationResult> {
  const body: SimulationRequest = {
    persona: {
      id: persona.id,
      name: persona.name,
      description: persona.description,
      traits: persona.traits,
      frustration: persona.frustration,
      techLevel: persona.techLevel,
    },
    sourceType,
    flowInput,
    productContext,
    language,
  };
  const raw = await postSimulate(body);
  return normalizeSimulationResult(raw, persona.id);
}
