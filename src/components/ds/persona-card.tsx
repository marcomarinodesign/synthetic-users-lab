import type { Persona } from "@/types";
import type { PersonaMetaCopy } from "@/lib/i18n";
import { Avatar } from "@/components/ds/avatar";
import { cn } from "@/lib/utils";

export interface PersonaCardProps {
  persona: Persona;
  selected: boolean;
  onToggle: (id: string) => void;
  meta: PersonaMetaCopy;
}

export function PersonaCard({ persona, selected, onToggle, meta }: PersonaCardProps) {
  const techLabel = meta.tech[persona.techLevel];
  const frustLabel = meta.frustration[persona.frustration];
  /** Un solo tag: el más relevante = primer rasgo en el orden definido en datos. */
  const primaryTrait = persona.traits[0];

  return (
    <button
      type="button"
      onClick={() => onToggle(persona.id)}
      aria-pressed={selected}
      aria-label={persona.name}
      className={cn(
        "flex h-[310px] min-h-[310px] w-full shrink-0 cursor-pointer flex-col rounded-[var(--space-8)] bg-[var(--color-basics-white)] p-[var(--space-8)] text-left outline-none transition-all duration-150",
        "focus-visible:ring-2 focus-visible:ring-[var(--color-accent-300)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-beige-25)]",
        selected &&
          "ring-2 ring-[var(--color-palette-pomegranate)] ring-offset-2 ring-offset-[var(--color-beige-25)]",
      )}
    >
      <div className="flex w-full items-start justify-between gap-[var(--space-4)]">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-[10px]">
            <h3 className="m-0 text-[17px] font-bold leading-[1.25] tracking-[-0.02em] text-foreground">
              {persona.name}
            </h3>
            {persona.category === "pro" && (
              <span className="inline-flex shrink-0 items-center rounded-[var(--radius-md)] bg-[var(--color-secondary)] px-2 py-0.5 text-[11px] font-semibold tracking-wide text-[var(--color-secondary-text)] uppercase">
                {meta.proBadgeLabel}
              </span>
            )}
          </div>
          <p className="m-0 mt-[var(--space-2)] text-[13px] font-normal leading-[1.45] text-foreground">
            {persona.category === "pro"
              ? meta.proSubtitle
              : `${techLabel} · ${meta.frustrationLabel} ${frustLabel}`}
          </p>
          {primaryTrait ? (
            <div className="mt-[var(--space-3)]">
              <span className="inline-flex max-w-full items-center rounded-[var(--radius-full)] bg-[var(--color-beige-25)] px-[var(--space-3)] py-[5px] text-[12px] leading-[1.35] text-foreground">
                {primaryTrait}
              </span>
            </div>
          ) : null}
        </div>
        <Avatar persona={persona} size={56} />
      </div>

      <div className="mt-auto flex min-h-0 w-full flex-1 items-end justify-between gap-[var(--space-4)] pt-[var(--space-6)]">
        <p className="m-0 min-h-0 min-w-0 flex-1 text-[13px] leading-[1.55] text-foreground line-clamp-6">
          {persona.description}
        </p>
        <span
          aria-hidden
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-[var(--radius-full)] transition-colors",
            "bg-[var(--color-beige-25)] text-foreground",
            selected && "bg-[var(--color-primary)] text-[var(--color-primary-text)]",
          )}
        >
          {selected ? (
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
              <path
                d="M3 8L6.5 11L13 4"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
              <path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          )}
        </span>
      </div>
    </button>
  );
}
