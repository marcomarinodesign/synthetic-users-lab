import { useEffect, useRef, useState } from "react";
import type { Persona, SimulationResult, Issue } from "@/types";
import type { IssueCategory } from "@/domain/simulation";
import type { ResultCardLabels } from "@/types/ds";
import {
  getIssueSeverityBadgeClass,
  getStatusVariantBadgeClass,
  issueCategoryBadgeClass,
  scoreToTier,
  stepIndexBadgeClass,
} from "@/lib/ui-status";
import { Badge as ShadBadge } from "@/components/ui/badge";
import { Button as ShadButton } from "@/components/ui/button";
import { Card as ShadCard } from "@/components/ui/card";
import type { AvatarPersona } from "@/components/ds/avatar";
import { Avatar } from "@/components/ds/avatar";

export interface ResultCardProps {
  result: SimulationResult;
  index: number;
  labels: ResultCardLabels;
  issueCategoryFilter: "all" | IssueCategory;
  personas: Persona[];
}

export function ResultCard({ result, index, labels, issueCategoryFilter, personas }: ResultCardProps) {
  const [open, setOpen] = useState(index === 0);
  const [currentStep, setCurrentStep] = useState(0);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const persona: AvatarPersona =
    personas.find((p) => p.id === result.personaId) ?? {
      name: "Custom",
      initials: "CU",
      avatarBg: "var(--color-accent-100)",
      avatarColor: "var(--color-accent-700)",
    };
  const sc = result.score || 0;
  const fit = result.fit_score || 0;
  const scoreBadgeClass = getStatusVariantBadgeClass(scoreToTier(sc));
  const fitBadgeClass = getStatusVariantBadgeClass(scoreToTier(fit));
  const issuesToShow =
    issueCategoryFilter === "all" ? result.issues : result.issues.filter((i) => i.category === issueCategoryFilter);

  useEffect(() => {
    if (!open) return;
    setCurrentStep(0);
  }, [open, result.personaId]);

  return (
    <ShadCard className="gap-0 border border-[var(--color-tertiary-border)] bg-[var(--color-basics-white)] py-0 shadow-none ring-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="flex w-full cursor-pointer items-center gap-[14px] border-none bg-transparent px-5 py-4 text-left font-sans outline-none"
      >
        <Avatar persona={persona} size={36} />
        <div className="flex-1">
          <div className="text-[16px] font-semibold text-foreground">{persona.name}</div>
          <div className="mt-[2px] text-[14px] text-foreground">
            {result.issues?.length || 0} {labels.issuesLabel} ·{" "}
            {result.wouldReturn ? labels.wouldReturnShort : labels.wouldNotReturnShort}
          </div>
        </div>
        <div className="flex items-center gap-[var(--space-2)]">
          <ShadBadge variant="outline" className={scoreBadgeClass}>
            UX {sc}/10
          </ShadBadge>
          <ShadBadge variant="outline" className={fitBadgeClass}>
            Fit {fit}/10
          </ShadBadge>
        </div>
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          className={`text-foreground transition-transform duration-200 ${open ? "rotate-180" : "rotate-0"}`}
        >
          <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="flex flex-col gap-4 px-5 pb-5">
          <div className="h-px bg-[var(--color-tertiary-border)]" />

          {result.summary && (
            <div>
              <div className="mb-[var(--space-2)] text-[11px] font-bold tracking-[0.05em] text-foreground uppercase">
                {labels.summaryLabel}
              </div>
              <p className="m-0 text-[14px] leading-[1.6] text-foreground">{result.summary}</p>
              <div className="mt-[10px] flex flex-wrap items-center gap-[var(--space-2)]">
                <ShadBadge variant="outline" className={fitBadgeClass}>
                  Fit {fit}/10
                </ShadBadge>
                {result.fit_note ? (
                  <span className="text-[13px] leading-[1.4] text-foreground">{result.fit_note}</span>
                ) : null}
              </div>
            </div>
          )}

          {result.steps?.length > 0 && (
            <div>
              <div className="mb-[var(--space-2)] text-[11px] font-bold tracking-[0.05em] text-foreground uppercase">
                {labels.stepsLabel}
              </div>
              <div>
                <div
                  className="relative overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-tertiary-border)] bg-[var(--color-basics-white)]"
                >
                  <div
                    className="overflow-hidden"
                    onTouchStart={(e) => {
                      const t0 = e.touches[0];
                      if (!t0) return;
                      touchStartRef.current = { x: t0.clientX, y: t0.clientY };
                    }}
                    onTouchEnd={(e) => {
                      const start = touchStartRef.current;
                      if (!start) return;
                      const t0 = e.changedTouches[0];
                      if (!t0) return;
                      const dx = t0.clientX - start.x;
                      const dy = t0.clientY - start.y;
                      touchStartRef.current = null;

                      if (Math.abs(dx) < 45 || Math.abs(dx) < Math.abs(dy)) return;
                      const total = result.steps.length;
                      if (dx < 0) setCurrentStep((s) => Math.min(total - 1, s + 1));
                      else setCurrentStep((s) => Math.max(0, s - 1));
                    }}
                  >
                    <div
                      className="flex transition-transform duration-300 ease-linear"
                      style={{ transform: `translateX(-${currentStep * 100}%)` }}
                    >
                      {result.steps.map((s, si) => (
                        <div key={si} className="relative box-border min-h-[200px] flex-[0_0_100%] p-[var(--space-5)]">
                          <div className="absolute top-[var(--space-3)] right-[14px] text-[12px] font-bold text-foreground">
                            {labels.stepCounter(si + 1, result.steps.length)}
                          </div>

                          <div className="flex items-start gap-[var(--space-3)]">
                            <ShadBadge variant="outline" className={stepIndexBadgeClass}>
                              {si + 1}
                            </ShadBadge>
                            <div className="flex-1">
                              <div className="text-[15px] font-extrabold leading-[20px] text-foreground">
                                {s.action}
                              </div>
                              <div className="mt-[6px] text-[14px] leading-[1.5] text-foreground">
                                {s.reaction}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <ShadButton
                    aria-label={labels.stepPrevAria}
                    onClick={() => setCurrentStep((s) => Math.max(0, s - 1))}
                    disabled={currentStep === 0}
                    variant="ghost"
                    className={[
                      "absolute top-1/2 left-[10px] flex size-[36px] -translate-y-1/2 items-center justify-center p-0",
                      "rounded-[var(--radius-full)] border border-[var(--color-tertiary-border)] bg-[var(--color-basics-white)]",
                      "shadow-[var(--shadow-sm)] transition-opacity duration-150",
                      currentStep === 0
                        ? "pointer-events-none cursor-not-allowed opacity-30"
                        : "cursor-pointer opacity-100",
                    ].join(" ")}
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                      <path
                        d="M9.5 3.5L5.5 8L9.5 12.5"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </ShadButton>

                  <ShadButton
                    aria-label={labels.stepNextAria}
                    onClick={() => setCurrentStep((s) => Math.min(result.steps.length - 1, s + 1))}
                    disabled={currentStep >= result.steps.length - 1}
                    variant="ghost"
                    className={[
                      "absolute top-1/2 right-[10px] flex size-[36px] -translate-y-1/2 items-center justify-center p-0",
                      "rounded-[var(--radius-full)] border border-[var(--color-tertiary-border)] bg-[var(--color-basics-white)]",
                      "shadow-[var(--shadow-sm)] transition-opacity duration-150",
                      currentStep >= result.steps.length - 1
                        ? "pointer-events-none cursor-not-allowed opacity-30"
                        : "cursor-pointer opacity-100",
                    ].join(" ")}
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                      <path
                        d="M6.5 3.5L10.5 8L6.5 12.5"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </ShadButton>
                </div>

                <div className="mt-[var(--space-3)] flex justify-center gap-[var(--space-2)]">
                  {result.steps.map((_, si) => {
                    const active = si === currentStep;
                    return (
                      <ShadButton
                        key={si}
                        aria-label={labels.stepGoToAria(si + 1)}
                        onClick={() => setCurrentStep(si)}
                        variant="ghost"
                        className="appearance-none border-none bg-transparent p-0"
                      >
                        <span
                          className={[
                            "block rounded-full",
                            active ? "size-[8px] bg-[var(--color-basics-black)]" : "size-[6px] bg-[var(--color-grey-middle)]",
                          ].join(" ")}
                        />
                      </ShadButton>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {result.issues?.length > 0 && (
            <div>
              <div className="mb-[var(--space-2)] text-[11px] font-bold tracking-[0.05em] text-foreground uppercase">
                {labels.issuesSectionLabel}
              </div>
              {issuesToShow.length > 0 ? (
                <div className="flex flex-col gap-[var(--space-3)]">
                  {issuesToShow.map((issue: Issue, ii: number) => (
                    <div key={ii} className="flex gap-[var(--space-4)] py-[var(--space-4)]">
                      <div className="flex shrink-0 flex-col gap-[6px]">
                        <div className="flex flex-wrap items-center gap-[6px]">
                          <ShadBadge variant="outline" className={getIssueSeverityBadgeClass(issue.severity)}>
                            {labels.sevLabels[issue.severity]}
                          </ShadBadge>
                          {issue.category ? (
                            <ShadBadge variant="outline" className={issueCategoryBadgeClass}>
                              {labels.issueCategoryLabels[issue.category as IssueCategory]}
                            </ShadBadge>
                          ) : null}
                        </div>
                        {issue.component ? (
                          <ShadBadge variant="default" className="max-w-full whitespace-normal break-words">
                            {issue.component}
                          </ShadBadge>
                        ) : null}
                      </div>

                      <div className="flex-1">
                        <p className="m-0 text-[14px] leading-[1.5] text-foreground">{issue.description}</p>
                        {issue.action ? (
                          <p className="m-0 mt-[var(--space-2)] text-[13px] leading-[1.5] text-foreground">
                            → {issue.action}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-[10px_14px] text-[14px] leading-[1.45] text-foreground">
                  {labels.issuesEmptyFilter}
                </div>
              )}
            </div>
          )}

          {result.verbatim && (
            <ShadCard className="rounded-md border border-[var(--color-tertiary-border)] border-l-[3px] border-l-[var(--color-primary)] bg-[var(--color-beige-25)] p-4 shadow-none">
              <p className="m-0 text-[14px] leading-[1.5] text-foreground italic">"{result.verbatim}"</p>
            </ShadCard>
          )}

          <div
            className={[
              "flex items-center gap-[var(--space-2)] rounded-[var(--radius-md)] border p-[10px_14px]",
              result.wouldReturn
                ? "border-[var(--color-accent-300)] bg-[var(--color-accent-100)]"
                : "border-[var(--color-error-2)] bg-[var(--color-error-3)]",
            ].join(" ")}
          >
            <span className="text-[15px]">{result.wouldReturn ? "✅" : "❌"}</span>
            <span className="text-[14px] font-semibold text-foreground">
              {result.wouldReturn ? labels.wouldReturn : labels.wouldNotReturn}
            </span>
          </div>
        </div>
      )}
    </ShadCard>
  );
}
