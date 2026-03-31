import type { SimulationResult } from "@/domain/simulation";
import type { Persona } from "@/types/persona";

function personaName(personas: Persona[], personaId: string): string {
  return personas.find((p) => p.id === personaId)?.name ?? personaId;
}

export function resultsToMarkdown(
  results: SimulationResult[],
  personas: Persona[],
  meta?: { flowInput?: string; productContext?: string }
): string {
  const lines: string[] = [];

  lines.push("# Synthetic Users Lab — Simulation Results");
  lines.push("");

  if (meta?.flowInput) {
    lines.push(`**Flow:** ${meta.flowInput}`);
  }
  if (meta?.productContext) {
    lines.push(`**Context:** ${meta.productContext}`);
  }
  if (meta?.flowInput || meta?.productContext) {
    lines.push("");
  }

  lines.push(`**Date:** ${new Date().toLocaleDateString()}`);
  lines.push(`**Users simulated:** ${results.length}`);
  lines.push("");
  lines.push("---");
  lines.push("");

  for (const r of results) {
    const name = personaName(personas, r.personaId);
    lines.push(`## ${name}`);
    lines.push("");

    lines.push(`**UX Score:** ${r.score}/10 · **Fit Score:** ${r.fit_score}/10`);

    const retention =
      r.wouldReturn === true
        ? "✅ Would use the product again"
        : r.wouldReturn === false
        ? "❌ Would not use the product again"
        : "Retention undetermined";
    lines.push(`**Retention:** ${retention}`);
    lines.push("");

    if (r.verbatim?.trim()) {
      lines.push(`> "${r.verbatim.trim()}"`);
      lines.push("");
    }

    if (r.summary?.trim()) {
      lines.push("### Summary");
      lines.push("");
      lines.push(r.summary.trim());
      lines.push("");
    }

    if (r.steps?.length > 0) {
      lines.push("### Journey");
      lines.push("");
      r.steps.forEach((s, i) => {
        lines.push(`**Step ${i + 1}:** ${s.action}`);
        lines.push(s.reaction);
        lines.push("");
      });
    }

    if (r.issues?.length > 0) {
      lines.push("### Issues");
      lines.push("");
      r.issues.forEach((issue) => {
        const sev =
          issue.severity.charAt(0).toUpperCase() + issue.severity.slice(1);
        const cat = issue.category
          ? ` [${issue.category.toUpperCase()}]`
          : "";
        lines.push(`- **${sev}${cat}:** ${issue.description}`);
        if (issue.action) {
          lines.push(`  → ${issue.action}`);
        }
      });
      lines.push("");
    }

    lines.push("---");
    lines.push("");
  }

  return lines.join("\n");
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      return true;
    } catch {
      return false;
    }
  }
}

export function downloadMarkdown(
  text: string,
  filename = "simulation-results.md"
): void {
  const blob = new Blob([text], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
