/** Product rule: max profiles per simulation run (step 0 → launch). */
export const MAX_SELECTED_PERSONAS_PER_FLOW = 3;

export function canAddPersonaSelection(selectedCount: number): boolean {
  return selectedCount < MAX_SELECTED_PERSONAS_PER_FLOW;
}
