import type { ChangeEvent, KeyboardEvent } from "react";
import { Input as ShadInput } from "@/components/ui/input";
import { Label as ShadLabel } from "@/components/ui/label";
import { FieldError } from "@/components/ui/field-error";
import { FieldHint } from "@/components/ui/field-hint";
import { isValidHttpUrl } from "@/lib/metaExtractor";

export interface FlowUrlFieldProps {
  id: string;
  hintId: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onClearEnrichError?: () => void;
  label: string;
  hint: string;
  placeholder: string;
  validationError?: string;
  enrichError?: string;
  onEnrichRequest: (opts?: { force?: boolean }) => void | Promise<void>;
  disabled?: boolean;
}

export function FlowUrlField({
  id,
  hintId,
  value,
  onChange,
  onClearEnrichError,
  label,
  hint,
  placeholder,
  validationError,
  enrichError,
  onEnrichRequest,
  disabled,
}: FlowUrlFieldProps) {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    onClearEnrichError?.();
    onChange(e);
  };

  const handleBlur = () => {
    if (!isValidHttpUrl(value)) return;
    void onEnrichRequest({ force: false });
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") return;
    if (!isValidHttpUrl(value)) return;
    e.preventDefault();
    void onEnrichRequest({ force: false });
  };

  return (
    <div>
      <ShadLabel htmlFor={id} className="text-[16px] font-semibold text-foreground">
        {label}
      </ShadLabel>
      <FieldHint id={hintId} className="mt-2 text-[16px] text-foreground/70">
        {hint}
      </FieldHint>
      <ShadInput
        id={id}
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className="mt-2 h-14 rounded-[8px] border-0 bg-[var(--color-basics-white)] px-4 shadow-none placeholder:text-foreground/80 focus-visible:border-[var(--color-accent-300)]"
        aria-invalid={Boolean(validationError)}
        aria-describedby={
          [validationError ? `${id}-error` : "", enrichError ? `${id}-enrich-error` : "", hintId]
            .filter(Boolean)
            .join(" ") || undefined
        }
      />
      <FieldError id={`${id}-error`}>{validationError}</FieldError>
      {enrichError ? (
        <p
          id={`${id}-enrich-error`}
          role="status"
          className="m-0 mt-1 text-sm text-[var(--color-basics-text-secondary)]"
        >
          {enrichError}
        </p>
      ) : null}
    </div>
  );
}
