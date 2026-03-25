import type { AnalysisMode } from "@/domain/simulation";
import type { Persona, SimulationResult, SourceType } from "@/types";
/** Clave localStorage — mismo contrato que un futuro backend puede mapear 1:1. */
export const STORAGE_KEY_HISTORY = "synthetic-users:history";

export interface SavedSimulation {
  id: string;
  savedAt: string;
  flowInput: string;
  sourceType: SourceType;
  productContext: string;
  /** App language at save time (English-only app uses `"en"`). */
  language: "en" | string;
  /** IDs de personas usadas en la corrida (preset + custom). */
  personaIds: string[];
  results: SimulationResult[];
  /** Copia de `Persona` para restaurar perfiles custom sin estado en memoria. */
  personasSnapshot?: Persona[];
  /** Modo de análisis usado en la corrida (fast | max). */
  analysisMode?: AnalysisMode;
}

function safeParse(json: string | null): SavedSimulation[] {
  if (!json) return [];
  try {
    const data = JSON.parse(json) as unknown;
    if (!Array.isArray(data)) return [];
    return data.filter((x): x is SavedSimulation => x && typeof x === "object" && typeof (x as SavedSimulation).id === "string");
  } catch {
    return [];
  }
}

export function loadSimulationHistory(): SavedSimulation[] {
  if (typeof localStorage === "undefined") return [];
  return safeParse(localStorage.getItem(STORAGE_KEY_HISTORY));
}

export function persistSimulationHistory(entries: SavedSimulation[]): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(entries));
}

export function appendSimulation(entry: Omit<SavedSimulation, "id" | "savedAt">): SavedSimulation {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const saved: SavedSimulation = {
    ...entry,
    id,
    savedAt: new Date().toISOString(),
  };
  const prev = loadSimulationHistory();
  persistSimulationHistory([saved, ...prev]);
  return saved;
}

export function deleteSimulation(id: string): void {
  const prev = loadSimulationHistory();
  persistSimulationHistory(prev.filter((x) => x.id !== id));
}

/** Interfaz para sustituir por API remota sin cambiar la UI. */
export interface SimulationHistoryRepository {
  list(): SavedSimulation[];
  append(entry: Omit<SavedSimulation, "id" | "savedAt">): SavedSimulation;
  remove(id: string): void;
}

export const localSimulationHistoryRepository: SimulationHistoryRepository = {
  list: loadSimulationHistory,
  append: appendSimulation,
  remove: deleteSimulation,
};
