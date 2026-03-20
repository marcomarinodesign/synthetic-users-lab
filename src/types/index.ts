export interface Persona {
  id: string;
  name: string;
  initials: string;
  avatarBg: string;
  avatarColor: string;
  avatarPhoto?: string;
  description: string;
  traits: string[];
  frustration: "low" | "medium" | "high";
  techLevel: "low" | "medium" | "high";
}

export interface FlowStep {
  action: string;
  reaction: string;
}

export interface Issue {
  severity: "critical" | "warning" | "info";
  description: string;
  // Campos opcionales: Gemini puede no enviarlos siempre.
  action?: string;
  component?: string;
  category?: "ux" | "ui" | "product" | "copy";
}

export interface SimulationResult {
  personaId: string;
  score: number;
  /**
   * Encaje producto-perfil (product-market fit para esta persona).
   * 1-10 (1 = no encaja, 10 = encaja).
   */
  fit_score: number;
  /** Nota corta explicando el encaje producto-perfil (PMF/fit). */
  fit_note: string;
  summary: string;
  steps: FlowStep[];
  issues: Issue[];
  wouldReturn: boolean | null;
  verbatim?: string;
}

export type SourceType = "url" | "figma" | "repo" | "description";

export interface SourceOption {
  id: SourceType;
  label: string;
  icon: string;
  placeholder: string;
}
