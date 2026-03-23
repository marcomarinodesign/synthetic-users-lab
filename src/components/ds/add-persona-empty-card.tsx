import { IconPlus } from "@tabler/icons-react";
import { cn } from "@/lib/utils";

export interface AddPersonaEmptyCardProps {
  title: string;
  hint: string;
  onClick: () => void;
}

export function AddPersonaEmptyCard({ title, hint, onClick }: AddPersonaEmptyCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={title}
      className={cn(
        "flex h-[310px] min-h-[310px] w-full shrink-0 cursor-pointer flex-col items-center justify-center rounded-[var(--space-8)] border border-dashed border-[var(--color-tertiary-border)] bg-[var(--color-basics-white)] p-[var(--space-6)] text-center outline-none transition-all duration-150",
        "shadow-[var(--shadow-sm)]",
        "hover:border-[var(--color-grey-middle)] hover:bg-[var(--color-beige-50)]",
        "focus-visible:ring-2 focus-visible:ring-[var(--color-accent-300)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-beige-25)]",
      )}
    >
      <span
        aria-hidden
        className="mb-[var(--space-4)] flex size-14 shrink-0 items-center justify-center rounded-[var(--radius-full)] bg-[var(--color-beige-25)] text-foreground"
      >
        <IconPlus stroke={1.75} className="size-7" />
      </span>
      <span className="text-[17px] font-bold leading-[1.25] tracking-[-0.02em] text-foreground">{title}</span>
      <span className="mt-[var(--space-2)] max-w-[16rem] text-[13px] leading-[1.45] text-[var(--color-basics-text-secondary)] line-clamp-4">
        {hint}
      </span>
    </button>
  );
}
