import { IconTrash, IconHistory } from "@tabler/icons-react";
import type { SavedSimulation } from "@/lib/storage";

interface SimulationHistoryPanelProps {
  history: SavedSimulation[];
  onRestore: (entry: SavedSimulation) => void;
  onDelete: (id: string) => void;
}

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function truncateFlowInput(input: string, maxLen = 60): string {
  const trimmed = input.trim();
  return trimmed.length > maxLen ? trimmed.slice(0, maxLen) + "…" : trimmed;
}

const SOURCE_TYPE_LABELS: Record<string, string> = {
  url: "URL",
  figma: "Figma",
  repo: "Repo",
  description: "Description",
};

export function SimulationHistoryPanel({ history, onRestore, onDelete }: SimulationHistoryPanelProps) {
  if (history.length === 0) return null;

  return (
    <section aria-label="Recent simulations" className="mt-[var(--space-10)]">
      <div className="mb-[var(--space-4)] flex items-center gap-2">
        <IconHistory aria-hidden className="size-[18px] shrink-0 text-foreground/60" stroke={1.5} />
        <h2 className="m-0 text-[14px] font-semibold uppercase tracking-[1.5px] text-foreground/60">
          Recent simulations
        </h2>
      </div>
      <ul className="m-0 flex list-none flex-col gap-[var(--space-2)] p-0">
        {history.slice(0, 8).map((entry) => (
          <li key={entry.id}>
            <div className="group flex items-center gap-3 rounded-[var(--radius-lg)] border border-[var(--color-tertiary-border)] bg-[var(--color-beige-25)] px-[var(--space-4)] py-[var(--space-3)] transition-colors hover:border-[var(--color-primary)]/30 hover:bg-[var(--color-basics-white)]">
              <button
                type="button"
                onClick={() => onRestore(entry)}
                className="flex min-w-0 flex-1 items-center gap-3 text-left"
                aria-label={`Restore simulation: ${entry.flowInput}`}
              >
                <span className="shrink-0 rounded-[var(--radius-full)] border border-[var(--color-tertiary-border)] bg-[var(--color-basics-white)] px-[8px] py-[3px] text-[11px] font-semibold uppercase tracking-[0.8px] text-foreground/70">
                  {SOURCE_TYPE_LABELS[entry.sourceType] ?? entry.sourceType}
                </span>
                <span className="min-w-0 truncate text-[14px] font-medium text-foreground">
                  {truncateFlowInput(entry.flowInput)}
                </span>
                <span className="ml-auto shrink-0 text-[12px] text-foreground/50">
                  {formatDate(entry.savedAt)}
                </span>
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(entry.id);
                }}
                aria-label="Delete simulation from history"
                className="shrink-0 rounded-[var(--radius-md)] p-[6px] text-foreground/40 opacity-0 transition-opacity hover:bg-[var(--color-error-50)] hover:text-[var(--color-error-600)] group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-error-300)]"
              >
                <IconTrash aria-hidden className="size-[15px]" stroke={1.5} />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
