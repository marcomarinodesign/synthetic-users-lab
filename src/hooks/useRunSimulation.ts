import { useState, useCallback } from "react";
import type { Persona, SimulationResult } from "@/types";
import type { AnalysisMode } from "@/domain/simulation";
import type { PreparedSimulationInput } from "@/lib/simulation-service";
import { prepareInput, runBatch } from "@/lib/simulation-service";
import type { SimulationPhase } from "@/types/simulation-stream";

export interface RunSimulationParams {
  flowInput: string;
  productContext: string;
  selectedPersonas: Persona[];
  analysisMode?: AnalysisMode;
}

export interface RunSimulationResult {
  results: SimulationResult[];
  prepared: PreparedSimulationInput;
}

export function useRunSimulation() {
  const [loading, setLoading] = useState(false);
  const [loadingPhase, setLoadingPhase] = useState<"fetching" | "analyzing_objective" | "analyzing_persona" | "done">("fetching");
  const [progress, setProgress] = useState({
    current: 0,
    total: 0,
    currentPersona: "",
    currentPersonaPhase: null as SimulationPhase | null,
    /** Inicio de la fase Gemini en curso (para cronómetro en vivo); null si no hay fase activa */
    currentPhaseStartAt: null as number | null,
    phaseDurationsMs: {
      objective_analysis: 0,
      persona_simulation: 0,
    },
  });

  const run = useCallback(async (params: RunSimulationParams): Promise<RunSimulationResult> => {
    const { flowInput, productContext, selectedPersonas, analysisMode = "max" } = params;
    setLoading(true);
    try {
      setLoadingPhase("fetching");
      const prepared = await prepareInput(flowInput);

      setLoadingPhase("analyzing_objective");
      setProgress({
        current: 0,
        total: selectedPersonas.length,
        currentPersona: "",
        currentPersonaPhase: null,
        currentPhaseStartAt: null,
        phaseDurationsMs: {
          objective_analysis: 0,
          persona_simulation: 0,
        },
      });

      const phaseStartByPersona = new Map<string, Partial<Record<SimulationPhase, number>>>();

      const results = await runBatch(selectedPersonas, prepared, productContext, {
        analysisMode,
        onProgress: (current, total, personaName) => {
          setProgress((prev) => ({ ...prev, current, total, currentPersona: personaName }));
        },
        onPhaseChange: (phase, status, personaName, timestamp) => {
          const starts = phaseStartByPersona.get(personaName) ?? {};
          if (status === "start") {
            starts[phase] = timestamp;
            phaseStartByPersona.set(personaName, starts);
            setLoadingPhase(phase === "objective_analysis" ? "analyzing_objective" : "analyzing_persona");
            setProgress((prev) => ({
              ...prev,
              currentPersona: personaName,
              currentPersonaPhase: phase,
              currentPhaseStartAt: timestamp,
            }));
            return;
          }

          const startedAt = starts[phase];
          const elapsed = startedAt ? Math.max(0, timestamp - startedAt) : 0;
          setProgress((prev) => ({
            ...prev,
            currentPhaseStartAt: null,
            phaseDurationsMs: {
              ...prev.phaseDurationsMs,
              [phase]: prev.phaseDurationsMs[phase] + elapsed,
            },
          }));
        },
      });

      setLoadingPhase("done");
      return { results, prepared };
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    run,
    loading,
    loadingPhase,
    progress,
    setLoading,
    setLoadingPhase,
    setProgress,
  };
}
