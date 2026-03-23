import { useState, useCallback } from "react";
import type { Persona, SimulationResult } from "@/types";
import type { Lang } from "@/lib/i18n";
import type { PreparedSimulationInput } from "@/lib/simulation-service";
import { prepareInput, runBatch } from "@/lib/simulation-service";

export interface RunSimulationParams {
  flowInput: string;
  productContext: string;
  language: Lang;
  selectedPersonas: Persona[];
}

export interface RunSimulationResult {
  results: SimulationResult[];
  prepared: PreparedSimulationInput;
}

export function useRunSimulation() {
  const [loading, setLoading] = useState(false);
  const [loadingPhase, setLoadingPhase] = useState<"fetching" | "analyzing">("fetching");
  const [progress, setProgress] = useState({ current: 0, total: 0, currentPersona: "" });

  const run = useCallback(async (params: RunSimulationParams): Promise<RunSimulationResult> => {
    const { flowInput, productContext, language, selectedPersonas } = params;
    setLoading(true);
    try {
      setLoadingPhase("fetching");
      const prepared = await prepareInput(flowInput);

      setLoadingPhase("analyzing");
      setProgress({ current: 0, total: selectedPersonas.length, currentPersona: "" });

      const results = await runBatch(selectedPersonas, prepared, productContext, language, {
        onProgress: (current, total, personaName) => {
          setProgress({ current, total, currentPersona: personaName });
        },
      });

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
