import type { KeyboardEvent } from "react";
import type { Persona } from "@/types";
import { Avatar } from "@/components/ds/avatar";

export interface PersonaResultTabItem {
  personaId: string;
  persona: Persona;
}

export interface PersonaResultTabsProps {
  items: PersonaResultTabItem[];
  selectedId: string;
  onSelect: (personaId: string) => void;
  /** `id` of the associated `role="tabpanel"` for `aria-controls`. */
  tabPanelId: string;
  /** Accessible name for the tab list (e.g. translated "Users"). */
  tablistLabel: string;
}

const TAB_FOCUS_STYLE = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent-300)]";

export function PersonaResultTabs({ items, selectedId, onSelect, tabPanelId, tablistLabel }: PersonaResultTabsProps) {
  const selectedIndex = Math.max(
    0,
    items.findIndex((i) => i.personaId === selectedId)
  );

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (items.length === 0) return;
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft" && e.key !== "Home" && e.key !== "End") return;
    e.preventDefault();
    const last = items.length - 1;
    let next = selectedIndex;
    if (e.key === "Home") next = 0;
    else if (e.key === "End") next = last;
    else if (e.key === "ArrowRight") next = selectedIndex >= last ? 0 : selectedIndex + 1;
    else if (e.key === "ArrowLeft") next = selectedIndex <= 0 ? last : selectedIndex - 1;
    onSelect(items[next].personaId);
  };

  return (
    <div
      role="tablist"
      aria-label={tablistLabel}
      onKeyDown={onKeyDown}
      className="mx-auto flex w-fit max-w-full flex-wrap content-center items-center justify-center gap-2 rounded-[20px] bg-[var(--color-basics-white)] p-2"
    >
      {items.map(({ personaId, persona }) => {
        const selected = personaId === selectedId;
        return (
          <button
            key={personaId}
            type="button"
            role="tab"
            id={`result-tab-${personaId}`}
            aria-selected={selected}
            aria-controls={tabPanelId}
            tabIndex={selected ? 0 : -1}
            onClick={() => onSelect(personaId)}
            className={[
              "inline-flex max-w-full min-w-0 items-center gap-2 rounded-[var(--radius-full)] px-3 py-2 font-sans text-[14px] font-bold text-foreground transition-colors",
              TAB_FOCUS_STYLE,
              selected
                ? "border border-[var(--color-palette-pomegranate)] bg-[var(--color-basics-white)]"
                : "border border-transparent bg-[var(--color-beige-25)]",
            ].join(" ")}
          >
            <Avatar persona={persona} size={24} border="0.48px solid var(--color-primary)" />
            <span className="truncate">{persona.name}</span>
          </button>
        );
      })}
    </div>
  );
}
