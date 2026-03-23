/**
 * @param {Partial<{
 *   personaId: string;
 *   score: number;
 *   fit_score: number;
 *   fit_note: string;
 *   summary: string;
 *   steps: { action: string; reaction: string }[];
 *   issues: { severity: string; description: string }[];
 *   wouldReturn: boolean | null;
 * }>} [overrides]
 */
export function makeSimulationResult(overrides = {}) {
  return {
    personaId: "p-1",
    score: 7,
    fit_score: 6,
    fit_note: "ok",
    summary: "Resumen",
    steps: [{ action: "Paso", reaction: "Reacción" }],
    issues: [{ severity: "warning", description: "Issue" }],
    wouldReturn: true,
    ...overrides,
  };
}
