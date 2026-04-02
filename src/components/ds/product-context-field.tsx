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
  /** Message over the textarea while the request runs. */
  autoFillBusyLabel: string;
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
  autoFillBusyLabel,
  onAutoFill,
  autoFillPending,
  canAutoFill,
  extractedFields,
  chipLabels,
}: ProductContextFieldProps) {
  const showChips = extractedFields.length > 0 && !autoFillPending;
  const hasHint = hint.trim().length > 0;

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
      {hasHint ? (
        <FieldHint id={hintId} className="mt-2 text-[14px] text-foreground/70">
          {hint}
        </FieldHint>
      ) : null}
      <div className="relative mt-2 min-h-[190px]">
        <ShadTextarea
          id={id}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          rows={rows}
          readOnly={autoFillPending}
          aria-busy={autoFillPending}
          aria-describedby={
            [hasHint ? hintId : "", autoFillPending ? `${id}-autofill-busy` : ""]
              .filter(Boolean)
              .join(" ") || undefined
          }
          className="min-h-[190px] rounded-[8px] border-0 bg-[var(--color-basics-white)] px-4 py-3 shadow-none read-only:cursor-wait placeholder:text-foreground/80 focus-visible:border-[var(--color-accent-300)]"
        />
        {autoFillPending ? (
          <div
            role="status"
            aria-live="polite"
            className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-[8px] bg-[var(--color-basics-white)]/88 px-4 backdrop-blur-[2px]"
          >
            <IconLoader2
              className="size-9 shrink-0 animate-spin text-foreground"
              aria-hidden
            />
            <p
              id={`${id}-autofill-busy`}
              className="m-0 max-w-[280px] text-center text-[14px] font-semibold leading-snug text-foreground"
            >
              {autoFillBusyLabel}
            </p>
          </div>
        ) : null}
      </div>
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
