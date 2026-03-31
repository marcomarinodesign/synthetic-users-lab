import { useState, useRef, useEffect } from "react";
import { IconDownload, IconCopy, IconCheck } from "@tabler/icons-react";
import { copyToClipboard, downloadMarkdown, resultsToMarkdown } from "@/lib/export";
import type { SimulationResult } from "@/domain/simulation";
import type { Persona } from "@/types/persona";

export interface ExportButtonLabels {
  export: string;
  copyMarkdown: string;
  downloadMarkdown: string;
  copied: string;
}

export interface ExportButtonProps {
  results: SimulationResult[];
  personas: Persona[];
  flowInput?: string;
  productContext?: string;
  labels: ExportButtonLabels;
}

export function ExportButton({
  results,
  personas,
  flowInput,
  productContext,
  labels,
}: ExportButtonProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleOutsideClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [open]);

  const getMarkdown = () =>
    resultsToMarkdown(results, personas, { flowInput, productContext });

  const handleCopy = async () => {
    const md = getMarkdown();
    await copyToClipboard(md);
    setOpen(false);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const md = getMarkdown();
    downloadMarkdown(md, "synthetic-users-results.md");
    setOpen(false);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1.5 text-[14px] font-medium text-[var(--color-primary)] underline underline-offset-4 transition-opacity hover:opacity-80"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {copied ? (
          <IconCheck aria-hidden className="size-[18px] shrink-0 text-[var(--color-success-1,#16a34a)]" stroke={2} />
        ) : (
          <IconDownload aria-hidden className="size-[18px] shrink-0" stroke={1.5} />
        )}
        {copied ? labels.copied : labels.export}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-1 min-w-[190px] rounded-[8px] border border-[var(--color-tertiary-border)] bg-[var(--color-basics-white)] py-1 shadow-[0_4px_16px_rgba(0,0,0,0.08)]"
        >
          <button
            type="button"
            role="menuitem"
            onClick={handleCopy}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-[14px] text-foreground transition-colors hover:bg-[var(--color-beige-25)]"
          >
            <IconCopy aria-hidden className="size-[14px] shrink-0" stroke={1.5} />
            {labels.copyMarkdown}
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={handleDownload}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-[14px] text-foreground transition-colors hover:bg-[var(--color-beige-25)]"
          >
            <IconDownload aria-hidden className="size-[14px] shrink-0" stroke={1.5} />
            {labels.downloadMarkdown}
          </button>
        </div>
      )}
    </div>
  );
}
