import type { Persona, SimulationResult, SourceType } from "@/types";
import type { SimulationStreamEvent } from "@/types/simulation-stream";
import type { AnalysisMode, SimulationRequest } from "@/domain/simulation";
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

function parseSseEventBlock(block: string): { event: string; data: string } | null {
  const lines = block.split("\n");
  let eventName = "";
  const dataLines: string[] = [];
  for (const line of lines) {
    if (line.startsWith("event:")) {
      eventName = line.slice(6).trim();
      continue;
    }
    if (line.startsWith("data:")) {
      dataLines.push(line.slice(5).trim());
    }
  }
  if (!eventName || dataLines.length === 0) return null;
  return { event: eventName, data: dataLines.join("\n") };
}

async function postSimulateStream(body: SimulationRequest, onEvent?: (event: SimulationStreamEvent) => void): Promise<SimulationResult> {
  const response = await fetch("/api/simulate-stream", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const err = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error || `API ${response.status}`);
  }
  if (!response.body) {
    throw new Error("Streaming no disponible en este entorno");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let finalResult: SimulationResult | null = null;
  let doneEventSeen = false;

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const blocks = buffer.split("\n\n");
    buffer = blocks.pop() ?? "";

    for (const block of blocks) {
      const parsed = parseSseEventBlock(block);
      if (!parsed) continue;
      try {
        const payload = JSON.parse(parsed.data) as unknown;
        if (parsed.event === "phase:start" || parsed.event === "phase:done") {
          const phasePayload = payload as { phase: "objective_analysis" | "persona_simulation" };
          onEvent?.({ type: parsed.event, phase: phasePayload.phase });
        } else if (parsed.event === "result:final") {
          const raw = payload as unknown;
          const result = normalizeSimulationResult(raw, body.persona.id);
          finalResult = result;
          onEvent?.({ type: "result:final", result });
        } else if (parsed.event === "error") {
          const errPayload = payload as { error?: string; code?: string; status?: number };
          const msg = errPayload.error || "Error de streaming";
          onEvent?.({ type: "error", error: msg, code: errPayload.code, status: errPayload.status });
          throw new Error(msg);
        } else if (parsed.event === "done") {
          const donePayload = payload as { ok?: boolean };
          doneEventSeen = true;
          onEvent?.({ type: "done", ok: Boolean(donePayload.ok) });
        }
      } catch (err) {
        if (err instanceof Error) throw err;
        throw new Error("Error parseando streaming SSE");
      }
    }
  }

  if (!finalResult) {
    if (doneEventSeen) {
      throw new Error("Streaming finalizado sin resultado");
    }
    throw new Error("Streaming incompleto");
  }
  return finalResult;
}

export async function simulatePersona(
  persona: Persona,
  sourceType: SourceType,
  flowInput: string,
  productContext: string,
  language = "en",
  seed?: number,
  analysisMode: AnalysisMode = "max"
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
    analysisMode,
    ...(seed !== undefined ? { seed } : {}),
  };
  const raw = await postSimulate(body);
  return normalizeSimulationResult(raw, persona.id);
}

export async function simulatePersonaStream(
  persona: Persona,
  sourceType: SourceType,
  flowInput: string,
  productContext: string,
  language = "en",
  seed?: number,
  onEvent?: (event: SimulationStreamEvent) => void,
  analysisMode: AnalysisMode = "max"
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
    analysisMode,
    ...(seed !== undefined ? { seed } : {}),
  };

  try {
    return await postSimulateStream(body, onEvent);
  } catch {
    const raw = await postSimulate(body);
    const fallback = normalizeSimulationResult(raw, persona.id);
    onEvent?.({ type: "result:final", result: fallback });
    onEvent?.({ type: "done", ok: true });
    return fallback;
  }
}

/** Seed entero válido para Gemini (regenerar con variación controlada). */
export function nextRegenerationSeed(): number {
  return Math.floor(Date.now() % 2147483647);
}
