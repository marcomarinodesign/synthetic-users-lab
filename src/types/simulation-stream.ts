import type { SimulationResult } from "@/types";

export type SimulationPhase = "objective_analysis" | "persona_simulation" | "ux_audit";

export type SimulationStreamEvent =
  | { type: "phase:start"; phase: SimulationPhase }
  | { type: "phase:done"; phase: SimulationPhase }
  | { type: "result:final"; result: SimulationResult }
  | { type: "error"; error: string; code?: string; status?: number }
  | { type: "done"; ok: boolean };
