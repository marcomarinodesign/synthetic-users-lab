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
}

export interface SimulationResult {
  personaId: string;
  score: number;
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
