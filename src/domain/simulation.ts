import type { Persona } from "@/types/persona";
import simulationEnums from "@/domain/simulation.enums.json";

/** Alineado con `simulation.enums.json` (fuente compartida con api/simulation-core). */
export const ISSUE_SEVERITIES = simulationEnums.issueSeverities as unknown as readonly [
  "critical",
  "warning",
  "info",
];
export const ISSUE_CATEGORIES = simulationEnums.issueCategories as unknown as readonly [
  "ux",
  "ui",
  "product",
  "copy",
];
export const SOURCE_TYPES = simulationEnums.sourceTypes as unknown as readonly ["url", "figma", "repo", "description"];

export type IssueSeverity = (typeof ISSUE_SEVERITIES)[number];
export type IssueCategory = (typeof ISSUE_CATEGORIES)[number];
export type SourceType = (typeof SOURCE_TYPES)[number];

export interface FlowStep {
  action: string;
  reaction: string;
}

export interface Issue {
  severity: IssueSeverity;
  description: string;
  action?: string;
  component?: string;
  category?: IssueCategory;
}

export interface SimulationResult {
  personaId: string;
  score: number;
  fit_score: number;
  fit_note: string;
  summary: string;
  steps: FlowStep[];
  issues: Issue[];
  wouldReturn: boolean | null;
  verbatim?: string;
}

/** Payload enviado a `POST /api/simulate` (contrato de dominio). */
export interface SimulationRequest {
  persona: Pick<Persona, "id" | "name" | "description" | "traits" | "frustration" | "techLevel">;
  sourceType: SourceType;
  flowInput: string;
  productContext: string;
  language?: string;
}

/** Respuesta del modelo / API (antes de normalizar en cliente). */
export interface SimulationResponse {
  personaId?: string;
  score: number;
  fit_score: number;
  fit_note: string;
  summary: string;
  steps: FlowStep[];
  issues: Issue[];
  wouldReturn: boolean | null;
  verbatim?: string;
}

export function isIssueSeverity(v: unknown): v is IssueSeverity {
  return typeof v === "string" && (ISSUE_SEVERITIES as readonly string[]).includes(v);
}

export function isIssueCategory(v: unknown): v is IssueCategory {
  return typeof v === "string" && (ISSUE_CATEGORIES as readonly string[]).includes(v);
}

export function isSourceType(v: unknown): v is SourceType {
  return typeof v === "string" && (SOURCE_TYPES as readonly string[]).includes(v);
}

export function normalizeIssue(input: unknown): Issue {
  if (!input || typeof input !== "object") {
    return { severity: "warning", description: "" };
  }
  const maybe = input as Partial<Record<string, unknown>>;
  const severityRaw = maybe.severity;
  const severity: IssueSeverity = isIssueSeverity(severityRaw) ? severityRaw : "warning";
  const categoryRaw = maybe.category;
  const category: Issue["category"] = isIssueCategory(categoryRaw) ? categoryRaw : undefined;
  const description = typeof maybe.description === "string" ? maybe.description : "";
  const action = typeof maybe.action === "string" && maybe.action.trim() ? maybe.action : undefined;
  const component = typeof maybe.component === "string" && maybe.component.trim() ? maybe.component : undefined;
  return { severity, description, action, component, category };
}

export function normalizeSimulationResult(data: unknown, personaId: string): SimulationResult {
  if (!data || typeof data !== "object") {
    return {
      personaId,
      score: 0,
      fit_score: 0,
      fit_note: "",
      summary: "",
      steps: [],
      issues: [],
      wouldReturn: null,
    };
  }
  const d = data as Partial<SimulationResponse> & Record<string, unknown>;
  const rawIssues: unknown = d.issues;
  const issues: Issue[] = Array.isArray(rawIssues) ? rawIssues.map(normalizeIssue) : [];

  const fitScoreRaw = d.fit_score;
  const fitNoteRaw = d.fit_note;
  const fit_score = typeof fitScoreRaw === "number" && Number.isFinite(fitScoreRaw) ? fitScoreRaw : 0;
  const fit_note = typeof fitNoteRaw === "string" ? fitNoteRaw : "";

  return {
    personaId: typeof d.personaId === "string" ? d.personaId : personaId,
    score: typeof d.score === "number" && Number.isFinite(d.score) ? d.score : 0,
    fit_score,
    fit_note,
    summary: typeof d.summary === "string" ? d.summary : "",
    steps: Array.isArray(d.steps) ? (d.steps as FlowStep[]) : [],
    issues,
    wouldReturn: typeof d.wouldReturn === "boolean" ? d.wouldReturn : null,
    verbatim: typeof d.verbatim === "string" ? d.verbatim : undefined,
  };
}
