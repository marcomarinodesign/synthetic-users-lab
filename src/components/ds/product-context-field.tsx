import type { ChangeEvent, ReactNode } from "react";
import { IconLoader2 } from "@tabler/icons-react";
import { Button as ShadButton } from "@/components/ui/button";
import { Label as ShadLabel } from "@/components/ui/label";
import { Textarea as ShadTextarea } from "@/components/ui/textarea";
import { FieldHint } from "@/components/ui/field-hint";
import { Badge } from "@/components/ui/badge";
import type { ExtractedFieldId } from "@/lib/metaExtractor";

const CHIP_ORDER: ExtractedFieldId[] = ["product", "description", "mainHeading", "keySections", "keywords"];

export interface ProductContextFieldProps {
  id: string;
  hintId: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  label: ReactNode;
  hint: string;
  placeholder: string;
  rows?: number;
  autoFillLabel: string;
  autoFillLoadingLabel: string;
  onAutoFill: () => void | Promise<void>;
  autoFillPending: boolean;
  canAutoFill: boolean;
  extractedFields: readonly ExtractedFieldId[];
  chipLabels: Record<ExtractedFieldId, string>;
}

export function ProductContextField({
  id,
  hintId,
  value,
  onChange,
  label,
  hint,
  placeholder,
  rows = 7,
  autoFillLabel,
  autoFillLoadingLabel,
  onAutoFill,
  autoFillPending,
  canAutoFill,
  extractedFields,
  chipLabels,
}: ProductContextFieldProps) {
  const showChips = extractedFields.length > 0 && !autoFillPending;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <ShadLabel htmlFor={id} className="m-0 text-[16px] font-semibold text-foreground">
          {label}
        </ShadLabel>
        <ShadButton
          type="button"
          variant="secondary"
          size="sm"
          className="rounded-full"
          disabled={!canAutoFill || autoFillPending}
          onClick={() => void onAutoFill()}
        >
          {autoFillPending ? (
            <span className="inline-flex items-center gap-1.5">
              <IconLoader2 className="size-4 shrink-0 animate-spin" aria-hidden />
              {autoFillLoadingLabel}
            </span>
          ) : (
            autoFillLabel
          )}
        </ShadButton>
      </div>
      <FieldHint id={hintId} className="mt-2 text-[16px] text-foreground/70">
        {hint}
      </FieldHint>
      <ShadTextarea
        id={id}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        className="mt-2 min-h-[190px] rounded-[8px] border-0 bg-[var(--color-basics-white)] px-4 py-3 shadow-none placeholder:text-foreground/80 focus-visible:border-[var(--color-accent-300)]"
        aria-describedby={hintId}
      />
      {showChips ? (
        <ul className="m-0 mt-2 flex list-none flex-wrap gap-2 p-0" aria-label={autoFillLabel}>
          {CHIP_ORDER.filter((k) => extractedFields.includes(k)).map((k) => (
            <li key={k}>
              <Badge variant="secondary" className="rounded-[var(--radius-full)] font-medium">
                {chipLabels[k]}
              </Badge>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
