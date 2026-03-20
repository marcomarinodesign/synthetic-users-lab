import type { Persona, SimulationResult, SourceType, Issue } from "@/types";

export async function fetchUrlContent(url: string): Promise<string> {
  const response = await fetch("/api/fetch-content", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
  if (!response.ok) {
    const err = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error || `HTTP ${response.status}`);
  }
  const data = (await response.json()) as { content: string };
  return data.content;
}

export async function simulatePersona(
  persona: Persona,
  sourceType: SourceType,
  flowInput: string,
  productContext: string,
  language = "es"
): Promise<SimulationResult> {
  const response = await fetch("/api/simulate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      persona: {
        id: persona.id,
        name: persona.name,
        description: persona.description,
        traits: persona.traits,
        frustration: persona.frustration,
        techLevel: persona.techLevel,
      },
      sourceType,
      flowInput,
      productContext,
      language,
    }),
  });

  if (!response.ok) {
    const err = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error || `API ${response.status}`);
  }

  const data = (await response.json()) as SimulationResult & { personaId?: string };

  const normalizeIssue = (input: unknown): Issue => {
    if (!input || typeof input !== "object") {
      return {
        severity: "warning",
        description: "",
      };
    }

    const maybe = input as Partial<Record<string, unknown>>;

    const severityRaw = maybe.severity;
    const severity: Issue["severity"] =
      severityRaw === "critical" || severityRaw === "warning" || severityRaw === "info" ? severityRaw : "warning";

    const categoryRaw = maybe.category;
    const category: Issue["category"] =
      categoryRaw === "ux" || categoryRaw === "ui" || categoryRaw === "product" || categoryRaw === "copy"
        ? categoryRaw
        : undefined;

    const description = typeof maybe.description === "string" ? maybe.description : "";
    const action = typeof maybe.action === "string" && maybe.action.trim() ? maybe.action : undefined;
    const component = typeof maybe.component === "string" && maybe.component.trim() ? maybe.component : undefined;

    return { severity, description, action, component, category };
  };

  const rawIssues: unknown = (data as unknown as { issues?: unknown }).issues;
  const issues: Issue[] = Array.isArray(rawIssues) ? rawIssues.map(normalizeIssue) : [];

  const fitScoreRaw = (data as { fit_score?: unknown }).fit_score;
  const fitNoteRaw = (data as { fit_note?: unknown }).fit_note;
  const fit_score = typeof fitScoreRaw === "number" && Number.isFinite(fitScoreRaw) ? fitScoreRaw : 0;
  const fit_note = typeof fitNoteRaw === "string" ? fitNoteRaw : "";

  return {
    personaId: persona.id,
    score: data.score ?? 0,
    fit_score,
    fit_note,
    summary: data.summary ?? "",
    steps: data.steps ?? [],
    issues,
    wouldReturn: data.wouldReturn ?? null,
    verbatim: data.verbatim,
  };
}
