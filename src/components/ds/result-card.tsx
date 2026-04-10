import { useEffect, useRef, useState, type Dispatch, type MutableRefObject, type SetStateAction } from "react";
import type { Persona, SimulationResult, Issue } from "@/types";
import type { IssueCategory } from "@/domain/simulation";
import type { ResultCardLabels } from "@/types/ds";
import {
  getIssueSeverityBadgeClass,
  getIssueSeverityPanelPillClass,
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
import { ResultFeedbackHero } from "@/components/ds/result-feedback-hero";

export interface IssueFilterOption {
  id: string;
  label: string;
}

export interface ResultCardProps {
  result: SimulationResult;
  index: number;
  labels: ResultCardLabels;
  issueCategoryFilter: "all" | IssueCategory;
  personas: Persona[];
  variant?: "accordion" | "panel";
  /** Vista panel: opciones del desplegable "Filtrar" en la sección Issues (Figma 1:714). */
  issueFilterOptions?: IssueFilterOption[];
  onIssueCategoryFilterChange?: (value: "all" | IssueCategory) => void;
}

function feedbackHeroQuoteText(result: SimulationResult): string {
  const verbatimTrimmed = result.verbatim?.trim() ?? "";
  const summaryTrimmed = result.summary?.trim() ?? "";
  return verbatimTrimmed || summaryTrimmed;
}

function feedbackHeroHeading(result: SimulationResult, labels: ResultCardLabels): string {
  if (result.wouldReturn === true) return labels.wouldReturn;
  if (result.wouldReturn === false) return labels.wouldNotReturn;
  return labels.feedbackHeroRetentionUnknown;
}

/** Texto de retención (antes en el banner inferior; ahora va en Resumen). */
function retentionSummaryLine(result: SimulationResult, labels: ResultCardLabels): string {
  if (result.wouldReturn === true) return labels.wouldReturn;
  if (result.wouldReturn === false) return labels.wouldNotReturn;
  return labels.feedbackHeroRetentionUnknown;
}

function splitSummaryBlocks(text: string): string[] {
  return text.split(/\n\n+/).map((s) => s.trim()).filter(Boolean);
}

function issuePanelTitle(issue: Issue): string {
  const c = issue.component?.trim();
  if (c) return c;
  const d = issue.description.trim();
  if (d.length <= 140) return d;
  return `${d.slice(0, 140)}…`;
}

const ISSUE_GRAY_PILL =
  "inline-flex max-w-full items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-beige-25)] px-2 py-2 text-[14px] font-normal leading-none text-[var(--color-primary)]";

function ResultCardDetails({
  result,
  labels,
  issuesToShow,
  currentStep,
  setCurrentStep,
  touchStartRef,
  hideTopDivider,
  omitFeedbackHero,
  hideRetentionInSummary,
  issueCategoryFilter,
  issueFilterOptions,
  onIssueCategoryFilterChange,
}: {
  result: SimulationResult;
  labels: ResultCardLabels;
  issuesToShow: Issue[];
  currentStep: number;
  setCurrentStep: Dispatch<SetStateAction<number>>;
  touchStartRef: MutableRefObject<{ x: number; y: number } | null>;
  hideTopDivider?: boolean;
  /** En vista panel el hero va fuera del card (Figma 1:691). */
  omitFeedbackHero?: boolean;
  /** Si el hero ya muestra el título de retención, no repetirlo bajo Resumen. */
  hideRetentionInSummary?: boolean;
  issueCategoryFilter: "all" | IssueCategory;
  issueFilterOptions?: IssueFilterOption[];
  onIssueCategoryFilterChange?: (value: "all" | IssueCategory) => void;
}) {
  const fit = result.fit_score || 0;
  const sc = result.score || 0;
  const fitBadgeClass = getStatusVariantBadgeClass(scoreToTier(fit));

  const verbatimTrimmed = result.verbatim?.trim() ?? "";
  const heroQuote = feedbackHeroQuoteText(result);
  const showedSummaryInHero = Boolean(heroQuote && !verbatimTrimmed);
  const feedbackHeroTitle = feedbackHeroHeading(result, labels);
  const isPanelLayout = Boolean(omitFeedbackHero);
  const summaryBlocks = result.summary ? splitSummaryBlocks(result.summary) : [];
  const step = result.steps[currentStep];
  const retentionText = retentionSummaryLine(result, labels);

  if (isPanelLayout) {
    const showIssuesFilter = Boolean(onIssueCategoryFilterChange && issueFilterOptions?.length);

    return (
      <div className="flex flex-col px-[var(--space-5)] pt-[var(--space-6)] pb-[var(--space-6)] sm:px-[var(--space-8)] sm:pt-[var(--space-10)] sm:pb-[var(--space-10)] md:px-[var(--space-12)] md:pt-[var(--space-12)] md:pb-[var(--space-12)]">
        <div className="flex flex-col gap-[var(--space-6)]">
          <section className="flex flex-col gap-[var(--space-6)]">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <h2 className="m-0 max-w-[min(100%,28rem)] font-serif text-[26px] font-normal italic leading-normal text-foreground sm:text-[32px] md:text-[36px]">
                {labels.summaryLabel}
              </h2>
              <div className="flex flex-wrap justify-end gap-2">
                <span className="inline-flex items-center justify-center rounded-[var(--radius-md)] bg-[#fb673c] px-2 py-2 text-[14px] font-medium text-[var(--color-primary)] whitespace-nowrap">
                  {labels.uxScoreLabel} {Math.round(sc)}/10
                </span>
                <span className="inline-flex items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-primary)] px-2 py-2 text-[14px] font-medium text-white whitespace-nowrap">
                  {labels.fitScoreLabel} {fit}/10
                </span>
              </div>
            </div>
            {!showedSummaryInHero && summaryBlocks.length > 0 ? (
              <div className="flex flex-col gap-[var(--space-6)] text-foreground">
                {summaryBlocks.map((block, i) => (
                  <p
                    key={i}
                    className={i === 0 ? "m-0 text-[18px] font-semibold leading-6" : "m-0 text-[16px] font-normal leading-6"}
                  >
                    {block}
                  </p>
                ))}
              </div>
            ) : null}
            {showedSummaryInHero && result.fit_note ? (
              <p className="m-0 text-[18px] font-normal leading-6 text-foreground">{result.fit_note}</p>
            ) : null}
            {!hideRetentionInSummary ? (
              <p className="m-0 flex items-start gap-2 text-[18px] leading-6 text-foreground">
                {result.wouldReturn === true ? (
                  <span aria-hidden className="shrink-0">
                    ✅
                  </span>
                ) : result.wouldReturn === false ? (
                  <span aria-hidden className="shrink-0">
                    ❌
                  </span>
                ) : null}
                <span className="font-semibold">{retentionText}</span>
              </p>
            ) : null}
          </section>

          {result.steps && result.steps.length > 0 && step ? (
          <section className="flex flex-col gap-[var(--space-6)]">
            <h3 className="m-0 font-sans text-[18px] font-bold leading-normal text-foreground">{labels.stepsLabel}</h3>
            <div
              className="flex min-h-[200px] items-center gap-2 rounded-[30px] bg-[var(--color-beige-25)] p-4 sm:gap-4 sm:p-6"
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
              <ShadButton
                type="button"
                aria-label={labels.stepPrevAria}
                onClick={() => setCurrentStep((s) => Math.max(0, s - 1))}
                disabled={currentStep === 0}
                variant="ghost"
                className={[
                  "hidden size-10 shrink-0 items-center justify-center rounded-full p-0 text-foreground sm:flex",
                  currentStep === 0 ? "pointer-events-none opacity-30" : "opacity-100",
                ].join(" ")}
              >
                <svg width="20" height="20" viewBox="0 0 16 16" fill="none" aria-hidden>
                  <path
                    d="M9.5 3.5L5.5 8L9.5 12.5"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </ShadButton>
              <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-[var(--space-6)] text-[var(--color-primary)]">
                <p className="m-0 text-[16px] font-semibold leading-6 sm:text-[18px]">{step.action}</p>
                <p className="m-0 text-[15px] font-normal leading-[22px] sm:text-[16px]">{step.reaction}</p>
              </div>
              <ShadButton
                type="button"
                aria-label={labels.stepNextAria}
                onClick={() => setCurrentStep((s) => Math.min(result.steps.length - 1, s + 1))}
                disabled={currentStep >= result.steps.length - 1}
                variant="ghost"
                className={[
                  "hidden size-10 shrink-0 items-center justify-center rounded-full p-0 text-foreground sm:flex",
                  currentStep >= result.steps.length - 1 ? "pointer-events-none opacity-30" : "opacity-100",
                ].join(" ")}
              >
                <svg width="20" height="20" viewBox="0 0 16 16" fill="none" aria-hidden>
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
            {result.steps.length > 1 ? (
              <div className="flex justify-center gap-[var(--space-2)] sm:hidden">
                {result.steps.map((_, si) => (
                  <button
                    key={si}
                    type="button"
                    aria-label={labels.stepGoToAria(si + 1)}
                    onClick={() => setCurrentStep(si)}
                    className="appearance-none border-none bg-transparent p-0"
                  >
                    <span
                      className={[
                        "block rounded-full",
                        si === currentStep
                          ? "size-[8px] bg-[var(--color-basics-black)]"
                          : "size-[6px] bg-[var(--color-grey-middle)]",
                      ].join(" ")}
                    />
                  </button>
                ))}
              </div>
            ) : null}
          </section>
        ) : null}
        </div>

        {result.issues && result.issues.length > 0 ? (
            <section className="mt-[var(--space-12)] flex flex-col gap-[var(--space-6)]">
              <div className="h-px bg-[var(--color-beige-25)]" />
              <div className="flex flex-wrap items-center justify-between gap-4">
                <h2 className="m-0 font-serif text-[26px] font-normal italic leading-normal text-foreground sm:text-[32px] md:text-[36px]">
                  {labels.issuesSectionLabel}
                </h2>
                {showIssuesFilter ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[14px] font-normal text-foreground">{labels.filterLabel}</span>
                    <label className="relative inline-flex">
                      <select
                        value={issueCategoryFilter}
                        onChange={(e) =>
                          onIssueCategoryFilterChange?.(e.target.value as "all" | IssueCategory)
                        }
                        className="h-10 appearance-none rounded-[var(--radius-full)] border-0 bg-[var(--color-beige-25)] py-0 pr-9 pl-3 text-[14px] font-normal text-foreground outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--color-accent-300)]"
                      >
                        {issueFilterOptions!.map((opt) => (
                          <option key={opt.id} value={opt.id}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      <span
                        className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-foreground/70"
                        aria-hidden
                      >
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                          <path
                            d="M4 6L8 10L12 6"
                            stroke="currentColor"
                            strokeWidth="1.6"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </span>
                    </label>
                  </div>
                ) : null}
              </div>
              {issuesToShow.length > 0 ? (
                <div className="flex flex-col gap-[var(--space-6)]">
                  {issuesToShow.map((issue: Issue, ii: number) => {
                    const title = issuePanelTitle(issue);
                    const titleIsComponent = Boolean(issue.component?.trim());
                    return (
                      <div key={ii} className="flex flex-col gap-[var(--space-6)]">
                        {ii > 0 && <div className="h-px bg-[var(--color-beige-25)]" />}
                        <p className="m-0 text-[18px] font-semibold leading-[22px] text-foreground">{title}</p>
                        <div className="flex flex-wrap gap-2">
                          {!titleIsComponent && issue.component?.trim() ? (
                            <span className={ISSUE_GRAY_PILL}>{issue.component.trim()}</span>
                          ) : null}
                          {issue.category ? (
                            <span className={ISSUE_GRAY_PILL}>
                              {labels.issueCategoryLabels[issue.category as IssueCategory]}
                            </span>
                          ) : null}
                          <span className={getIssueSeverityPanelPillClass(issue.severity)}>
                            {labels.sevLabels[issue.severity]}
                          </span>
                        </div>
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-stretch sm:gap-6">
                          <div className="flex w-full flex-col gap-4 rounded-[20px] border-2 border-[var(--color-beige-25)] bg-[var(--color-basics-white)] p-6 sm:w-[386px] sm:shrink-0">
                            <p className="m-0 text-[18px] font-semibold leading-[22px] text-foreground">{labels.issueDescriptionLabel}</p>
                            <p className="m-0 text-[16px] font-normal leading-[22px] text-foreground">{issue.description}</p>
                          </div>
                          {issue.action ? (
                            <>
                              <div className="flex shrink-0 items-center sm:flex-col">
                                <div className="flex items-center justify-center rounded-full bg-[var(--color-beige-25)] p-2">
                                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
                                    <path
                                      d="M9 18L15 12L9 6"
                                      stroke="currentColor"
                                      strokeWidth="1.6"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    />
                                  </svg>
                                </div>
                              </div>
                              <div className="flex min-w-0 flex-1 items-stretch">
                                <div className="flex w-full flex-col gap-4 rounded-[20px] border-2 border-[var(--color-beige-25)] bg-[var(--color-basics-white)] p-6">
                                  <p className="m-0 text-[18px] font-semibold leading-[22px] text-foreground">{labels.issueActionLabel}</p>
                                  <p className="m-0 text-[16px] font-normal leading-[22px] text-foreground">{issue.action}</p>
                                </div>
                              </div>
                            </>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-[14px] leading-[1.45] text-foreground">{labels.issuesEmptyFilter}</div>
              )}
            </section>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 px-5 pb-5">
      {!hideTopDivider ? <div className="h-px bg-[var(--color-tertiary-border)]" /> : null}

      {!omitFeedbackHero && heroQuote ? (
        <ResultFeedbackHero title={feedbackHeroTitle} quoteText={heroQuote} />
      ) : null}

      <div>
        <div className="mb-[var(--space-2)] text-[11px] font-bold tracking-[0.05em] text-foreground uppercase">
          {labels.summaryLabel}
        </div>
        {!showedSummaryInHero && result.summary?.trim() ? (
          <p className="m-0 text-[16px] leading-[1.6] text-foreground">{result.summary}</p>
        ) : null}
        <div className="mt-[10px] flex flex-wrap items-center gap-[var(--space-2)]">
          <ShadBadge variant="outline" className={fitBadgeClass}>
            {labels.fitScoreLabel} {fit}/10
          </ShadBadge>
          {result.fit_note ? (
            <span className="text-[13px] leading-[1.4] text-foreground">{result.fit_note}</span>
          ) : null}
        </div>
        {!hideRetentionInSummary ? (
          <p className="m-0 mt-[var(--space-3)] flex items-start gap-2 text-[14px] font-semibold leading-[1.5] text-foreground">
            {result.wouldReturn === true ? (
              <span aria-hidden className="shrink-0">
                ✅
              </span>
            ) : result.wouldReturn === false ? (
              <span aria-hidden className="shrink-0">
                ❌
              </span>
            ) : null}
            <span>{retentionText}</span>
          </p>
        ) : null}
      </div>

      {result.steps?.length > 0 && (
        <div>
          <div className="mb-[var(--space-2)] text-[11px] font-bold tracking-[0.05em] text-foreground uppercase">
            {labels.stepsLabel}
          </div>
          <div>
            <div className="relative overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-tertiary-border)] bg-[var(--color-basics-white)]">
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
                          <div className="text-[15px] font-extrabold leading-[20px] text-foreground">{s.action}</div>
                          <div className="mt-[6px] text-[14px] leading-[1.5] text-foreground">{s.reaction}</div>
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
            <div className="p-[10px_14px] text-[14px] leading-[1.45] text-foreground">{labels.issuesEmptyFilter}</div>
          )}
        </div>
      )}
    </div>
  );
}

export function ResultCard({
  result,
  index,
  labels,
  issueCategoryFilter,
  personas,
  variant = "accordion",
  issueFilterOptions,
  onIssueCategoryFilterChange,
}: ResultCardProps) {
  const isPanel = variant === "panel";
  const [open, setOpen] = useState(index === 0);
  const [currentStep, setCurrentStep] = useState(0);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const persona: AvatarPersona =
    personas.find((p) => p.id === result.personaId) ?? {
      name: labels.unknownPersonaName,
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

  const showContent = isPanel || open;
  const panelHeroQuote = feedbackHeroQuoteText(result);
  const showPanelFeedbackHero = isPanel && Boolean(panelHeroQuote);

  useEffect(() => {
    if (!isPanel && !open) return;
    setCurrentStep(0);
  }, [isPanel, open, result.personaId]);

  const cardShell = (
    <ShadCard
      className={[
        "gap-0 border border-[var(--color-tertiary-border)] bg-[var(--color-basics-white)] py-0 shadow-none ring-0",
        isPanel ? "rounded-[30px]" : "",
      ].join(" ")}
    >
      {!isPanel ? (
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
          <div className="flex shrink-0 items-center gap-[var(--space-2)]">
            <ShadBadge variant="outline" className={scoreBadgeClass}>
              {labels.uxScoreLabel} {sc}/10
            </ShadBadge>
            <ShadBadge variant="outline" className={fitBadgeClass}>
              {labels.fitScoreLabel} {fit}/10
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
      ) : null}

      {showContent && (
        <ResultCardDetails
          result={result}
          labels={labels}
          issuesToShow={issuesToShow}
          currentStep={currentStep}
          setCurrentStep={setCurrentStep}
          touchStartRef={touchStartRef}
          hideTopDivider={isPanel}
          omitFeedbackHero={isPanel}
          hideRetentionInSummary={isPanel ? showPanelFeedbackHero : Boolean(panelHeroQuote)}
          issueCategoryFilter={issueCategoryFilter}
          issueFilterOptions={issueFilterOptions}
          onIssueCategoryFilterChange={onIssueCategoryFilterChange}
        />
      )}
    </ShadCard>
  );

  if (isPanel) {
    return (
      <div className="flex w-full flex-col gap-9">
        {showPanelFeedbackHero ? (
          <ResultFeedbackHero
            title={feedbackHeroHeading(result, labels)}
            quoteText={panelHeroQuote}
          />
        ) : null}
        {cardShell}
      </div>
    );
  }

  return cardShell;
}
