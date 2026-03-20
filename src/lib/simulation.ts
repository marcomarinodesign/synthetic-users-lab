import type { Persona, SimulationResult, SourceType } from "@/types";

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

export async function simulatePersona(
  persona: Persona,
  sourceType: SourceType,
  flowInput: string,
  productContext: string,
  language = "es"
): Promise<SimulationResult> {
  const response = await fetch("/api/simulate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
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
    }),
  });

  if (!response.ok) {
    const err = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error || `API ${response.status}`);
  }

  const data = (await response.json()) as SimulationResult & { personaId?: string };

  return {
    personaId: persona.id,
    score: data.score ?? 0,
    summary: data.summary ?? "",
    steps: data.steps ?? [],
    issues: data.issues ?? [],
    wouldReturn: data.wouldReturn ?? null,
    verbatim: data.verbatim,
  };
}
