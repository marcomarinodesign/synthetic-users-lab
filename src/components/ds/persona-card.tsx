import type { Persona } from "@/types";
import type { PersonaMetaCopy } from "@/lib/i18n";
import { Avatar } from "@/components/ds/avatar";
import { cn } from "@/lib/utils";

export interface PersonaCardProps {
  persona: Persona;
  selected: boolean;
  onToggle: (id: string) => void;
  meta: PersonaMetaCopy;
  /** When true, card cannot be selected (max reached); deselect still allowed via parent not passing this for selected cards. */
  selectionDisabled?: boolean;
  /** Explains why selection is blocked (e.g. max profiles). */
  selectionLimitTitle?: string;
}

export function PersonaCard({ persona, selected, onToggle, meta, selectionDisabled, selectionLimitTitle }: PersonaCardProps) {
  const techLabel = meta.tech[persona.techLevel];
  const frustLabel = meta.frustration[persona.frustration];
  const primaryTrait = persona.traits[0];
  const topicTagBaseClass =
    "inline-flex shrink-0 items-center rounded-[8px] p-2 text-[11px] leading-[1.2] uppercase";
  const topicTagVariantClass = {
    neutral: "max-w-full bg-[var(--color-beige-25)] text-foreground",
    pro: "bg-[var(--color-secondary)] font-semibold tracking-wide text-[var(--color-secondary-text)] uppercase",
  } as const;

  const isBlocked = Boolean(selectionDisabled && !selected);
  const ariaLabel =
    isBlocked && selectionLimitTitle ? `${persona.name}. ${selectionLimitTitle}` : persona.name;

  return (
    <button
      type="button"
      disabled={isBlocked}
      onClick={() => onToggle(persona.id)}
      aria-pressed={selected}
      aria-label={ariaLabel}
      title={isBlocked ? selectionLimitTitle : undefined}
      className={cn(
        "flex h-[310px] min-h-[310px] w-full shrink-0 flex-col rounded-[var(--space-8)] bg-[var(--color-basics-white)] p-[var(--space-8)] text-left outline-none transition-all duration-150",
        isBlocked
          ? "cursor-not-allowed opacity-50"
          : "cursor-pointer focus-visible:ring-2 focus-visible:ring-[var(--color-accent-300)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-beige-25)]",
        !isBlocked &&
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
          </div>
          <p
            className="m-0 mt-[var(--space-2)] overflow-hidden text-ellipsis whitespace-nowrap text-[13px] font-normal leading-[1.45] text-foreground"
            title={
              persona.category === "pro"
                ? meta.proSubtitle
                : `${techLabel} · ${meta.frustrationLabel} ${frustLabel}`
            }
          >
            {persona.category === "pro"
              ? meta.proSubtitle
              : `${techLabel} · ${meta.frustrationLabel} ${frustLabel}`}
          </p>
          {primaryTrait || persona.category === "pro" ? (
            <div className="mt-[var(--space-3)] flex flex-wrap items-center gap-2">
              {primaryTrait ? (
                <span className={cn(topicTagBaseClass, topicTagVariantClass.neutral)}>
                  {primaryTrait}
                </span>
              ) : null}
              {persona.category === "pro" ? (
                <span className={cn(topicTagBaseClass, topicTagVariantClass.pro)}>
                  {meta.proBadgeLabel}
                </span>
              ) : null}
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
