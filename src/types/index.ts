import type { SourceType } from "@/domain/simulation";

export type { Persona } from "./persona";
export type { SimulationPhase, SimulationStreamEvent } from "./simulation-stream";
export type {
  FlowStep,
  Issue,
  IssueCategory,
  IssueSeverity,
  SimulationRequest,
  SimulationResponse,
  SimulationResult,
  SourceType,
  UxAuditIssue,
  UxAuditReport,
  UxAuditSeverity,
} from "@/domain/simulation";

export interface SourceOption {
  id: SourceType;
  label: string;
  icon: string;
  placeholder: string;
}
