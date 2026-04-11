import type { Persona, SimulationResult, SourceType } from "@/types";
import type { AnalysisMode } from "@/domain/simulation";
import type { SimulationPhase } from "@/types/simulation-stream";
import { getSimulationErrorCopy } from "@/lib/i18n";
import { normalizeSimulationResult } from "@/domain/simulation";
import { fetchUrlContent, simulatePersonaStream } from "@/lib/simulation";

export { normalizeSimulationResult as normalizeResult } from "@/domain/simulation";

export interface PreparedSimulationInput {
  content: string;
  sourceType: SourceType;
}

/**
 * Resuelve el texto a enviar al modelo (fetch de URL si aplica) y el `sourceType` de dominio.
 */
export async function prepareInput(
  flowInput: string,
  fetchContent: (url: string) => Promise<string> = fetchUrlContent
): Promise<PreparedSimulationInput> {
  const trimmed = flowInput.trim();
  const sourceType: SourceType = trimmed.toLowerCase().includes("github.com") ? "repo" : "url";
  let content = flowInput;
  if (trimmed.startsWith("http")) {
    try {
      const fetched = await fetchContent(trimmed);
      // SPAs and bot-protected sites return an empty or near-empty body.
      // Fall back to the URL itself so Gemini can still infer context from it.
      content = fetched.trim().length >= 100 ? fetched : flowInput;
    } catch {
      content = flowInput;
    }
  }
  return { content, sourceType };
}

export interface RunBatchOptions {
  onProgress?: (current: number, total: number, personaName: string) => void;
  onPhaseChange?: (phase: SimulationPhase, status: "start" | "done", personaName: string, timestamp: number) => void;
  analysisMode?: AnalysisMode;
}

/**
 * Ejecuta la simulación para cada persona; errores por persona se convierten en resultado sintético (como en la UI).
 */
export async function runBatch(
  personas: Persona[],
  prepared: PreparedSimulationInput,
  productContext: string,
  options?: RunBatchOptions
): Promise<SimulationResult[]> {
  const out: SimulationResult[] = [];
  const errCopy = getSimulationErrorCopy();
  const analysisMode = options?.analysisMode ?? "max";
  for (let i = 0; i < personas.length; i++) {
    const p = personas[i];
    options?.onProgress?.(i + 1, personas.length, p.name);
    try {
      out.push(
        await simulatePersonaStream(
          p,
          prepared.sourceType,
          prepared.content,
          productContext,
          "en",
          undefined,
          (evt) => {
            if (evt.type === "phase:start") {
              options?.onPhaseChange?.(evt.phase, "start", p.name, Date.now());
            } else if (evt.type === "phase:done") {
              options?.onPhaseChange?.(evt.phase, "done", p.name, Date.now());
            }
          },
          analysisMode
        )
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      out.push(
        normalizeSimulationResult(
          {
            personaId: p.id,
            score: 0,
            fit_score: 0,
            fit_note: "",
            summary: errCopy.summary(msg),
            steps: [],
            issues: [
              {
                severity: "critical",
                description: msg,
                action: errCopy.action,
                component: errCopy.component,
                category: "ux",
              },
            ],
            wouldReturn: false,
          },
          p.id
        )
      );
    }
  }
  return out;
}
