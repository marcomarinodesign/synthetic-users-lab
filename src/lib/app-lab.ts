import type { Persona, SimulationResult } from "@/types";
import type { Translations } from "@/lib/i18n";

export function countSelectionByCategory(
  personas: Persona[],
  selectedIds: string[]
): { simpleCount: number; proCount: number; totalSelected: number } {
  const simpleCount = selectedIds.filter(
    (id) => (personas.find((p) => p.id === id)?.category ?? "simple") === "simple"
  ).length;
  const proCount = selectedIds.filter((id) => (personas.find((p) => p.id === id)?.category ?? "simple") === "pro").length;
  return { simpleCount, proCount, totalSelected: simpleCount + proCount };
}

export function personaSelectionLabel(
  t: Pick<Translations, "selectAtLeastOne" | "formatSelectionCounter">,
  simpleCount: number,
  proCount: number,
  totalSelected: number
): string {
  if (totalSelected === 0) return t.selectAtLeastOne;
  return t.formatSelectionCounter(simpleCount, proCount, totalSelected);
}

export interface CustomPersonaFormInput {
  name: string;
  description: string;
  traits: string;
}

export function validateCustomPersonaForm(
  input: CustomPersonaFormInput,
  t: Pick<Translations, "validationNameRequired" | "validationDescriptionRequired">
): { name?: string; description?: string } {
  const nameTrim = input.name.trim();
  const descTrim = input.description.trim();
  if (!nameTrim || !descTrim) {
    return {
      name: !nameTrim ? t.validationNameRequired : undefined,
      description: !descTrim ? t.validationDescriptionRequired : undefined,
    };
  }
  return {};
}

export function buildCustomPersonaFromForm(
  input: CustomPersonaFormInput,
  category: "simple" | "pro",
  id: string
): Persona {
  const nameTrim = input.name.trim();
  const descTrim = input.description.trim();
  return {
    id,
    name: nameTrim,
    category,
    initials: input.name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase(),
    avatarBg: "var(--color-beige-50)",
    avatarColor: "var(--color-basics-black)",
    description: descTrim,
    traits: input.traits.split(",").map((x) => x.trim()).filter(Boolean),
    frustration: category === "pro" ? "low" : "medium",
    techLevel: category === "pro" ? "high" : "medium",
  };
}

export function aggregateSimulationResults(results: SimulationResult[] | null) {
  if (!results?.length) {
    return {
      avgScore: 0,
      avgFormatted: "0.0",
      issueCount: 0,
      critCount: 0,
      retainCount: 0,
    };
  }
  const avgScore = results.reduce((a, r) => a + (r.score || 0), 0) / results.length;
  const issueCount = results.reduce((a, r) => a + (r.issues?.length ?? 0), 0);
  const critCount = results.reduce(
    (a, r) => a + (r.issues?.filter((i) => i.severity === "critical").length ?? 0),
    0
  );
  const retainCount = results.filter((r) => r.wouldReturn).length;
  return {
    avgScore,
    avgFormatted: avgScore.toFixed(1),
    issueCount,
    critCount,
    retainCount,
  };
}
