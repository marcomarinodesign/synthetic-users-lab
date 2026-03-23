import { useState, useCallback, useMemo } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { Persona, SimulationResult } from "@/types";
import type { IssueCategory } from "@/domain/simulation";
import { PRESET_PERSONAS } from "@/lib/personas";
import { appendSimulation } from "@/lib/storage";
import { LANG_OPTIONS, TRANSLATIONS, detectLang, pickResultCardLabels, type Lang } from "@/lib/i18n";
import { getLocalizedPersona } from "@/lib/persona-localize";
import { useRunSimulation } from "@/hooks/useRunSimulation";
import {
  aggregateSimulationResults,
  buildCustomPersonaFromForm,
  countSelectionByCategory,
  personaSelectionLabel,
  validateCustomPersonaForm,
} from "@/lib/app-lab";
import { IconChevronDown } from "@tabler/icons-react";
import { scoreToTier, type StatusVariant } from "@/lib/ui-status";
import { MetricCard } from "@/components/ds/metric-card";
import { PersonaCard } from "@/components/ds/persona-card";
import { ResultCard } from "@/components/ds/result-card";

import { Button as ShadButton } from "@/components/ui/button";
import { Card as ShadCard } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input as ShadInput } from "@/components/ui/input";
import { Label as ShadLabel } from "@/components/ui/label";
import { Textarea as ShadTextarea } from "@/components/ui/textarea";
import { Progress as ShadProgress } from "@/components/ui/progress";
import { FieldError } from "@/components/ui/field-error";
import { FieldHint } from "@/components/ui/field-hint";

const ISSUE_FILTER_IDS = ["all", "ux", "ui", "product", "copy"] as const;

const easeOut = [0.22, 1, 0.36, 1] as const;

export default function SyntheticUsersLab() {
  const reduceMotion = useReducedMotion();
  const [step, setStep] = useState(0);
  const [personas, setPersonas] = useState<Persona[]>(PRESET_PERSONAS);
  const [selectedPersonas, setSelectedPersonas] = useState<string[]>([]);
  const [customPersona, setCustomPersona] = useState({ name: "", description: "", traits: "" });
  const [flowInput, setFlowInput] = useState("");
  const [productContext, setProductContext] = useState("");
  const [results, setResults] = useState<SimulationResult[] | null>(null);
  const { run: runSimulation, loading, loadingPhase, progress } = useRunSimulation();
  const [showModal, setShowModal] = useState(false);
  const [language, setLanguage] = useState<Lang>(detectLang);
  const [issueCategoryFilter, setIssueCategoryFilter] = useState<"all" | IssueCategory>("all");
  const [flowError, setFlowError] = useState<string | undefined>();
  const [modalFieldErrors, setModalFieldErrors] = useState<{ name?: string; description?: string }>({});
  const t = TRANSLATIONS[language];
  const resultCardLabels = pickResultCardLabels(t);
  const displayPersonas = useMemo(
    () => personas.map((p) => getLocalizedPersona(p, language)),
    [personas, language]
  );

  const toggle = (id: string) =>
    setSelectedPersonas((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const canAdd = Boolean(customPersona.name.trim() && customPersona.description.trim());
  const { simpleCount, proCount, totalSelected } = countSelectionByCategory(personas, selectedPersonas);
  const counterText = personaSelectionLabel(t, simpleCount, proCount, totalSelected);

  const addCustom = () => {
    const errors = validateCustomPersonaForm(customPersona, t);
    if (errors.name || errors.description) {
      setModalFieldErrors({
        name: errors.name,
        description: errors.description,
      });
      return;
    }
    setModalFieldErrors({});
    const id = `custom-${Date.now()}`;
    const newPersona = buildCustomPersonaFromForm(customPersona, "simple", id);
    setPersonas((prev) => [...prev, newPersona]);
    setSelectedPersonas((p) => [...p, id]);
    setCustomPersona({ name: "", description: "", traits: "" });
    setShowModal(false);
  };

  const run = useCallback(async () => {
    setResults(null);
    setIssueCategoryFilter("all");
    const selectedPersonaRecords = personas.filter((p) => selectedPersonas.includes(p.id));
    const localizedSelected = selectedPersonaRecords.map((p) => getLocalizedPersona(p, language));
    const { results: all, prepared } = await runSimulation({
      flowInput,
      productContext,
      language,
      selectedPersonas: localizedSelected,
    });
    setResults(all);
    appendSimulation({
      flowInput: flowInput.trim(),
      sourceType: prepared.sourceType,
      productContext,
      language,
      personaIds: selectedPersonaRecords.map((p) => p.id),
      results: all,
      personasSnapshot: localizedSelected,
    });
    setStep(3);
  }, [selectedPersonas, flowInput, productContext, language, personas, runSimulation]);

  const { avgScore, avgFormatted: avg, issueCount, critCount, retainCount } = aggregateSimulationResults(results);

  const tStep = reduceMotion ? { duration: 0 } : { duration: 0.32, ease: easeOut };
  const tHero = reduceMotion ? { duration: 0 } : { duration: 0.45, ease: easeOut };
  const tStagger = reduceMotion ? { duration: 0 } : { duration: 0.28, ease: easeOut };

  return (
    <div className="relative z-[1] min-h-[100vh] px-[var(--space-5)] py-[var(--space-10)] font-sans text-foreground antialiased md:px-[var(--space-8)]">
      <div className="relative mx-auto w-full max-w-[1200px]">
        <motion.header
          className="relative z-[1] mb-[36px] w-full"
          initial={reduceMotion ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={tHero}
        >
          <div className="flex w-full items-start justify-between gap-[var(--space-4)]">
            <motion.h1
              className="m-0 min-w-0 flex-1 text-left text-[clamp(2.5rem,10vw,5rem)] font-normal leading-[1.05] tracking-[-0.02em] text-foreground md:text-[80px]"
              style={{ fontFamily: "var(--font-serif)" }}
              initial={reduceMotion ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...tHero, delay: reduceMotion ? 0 : 0.05 }}
            >
              {t.appTitle}
            </motion.h1>
            <motion.div
              className="relative shrink-0 pt-1"
              initial={reduceMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...tHero, delay: reduceMotion ? 0 : 0.12 }}
            >
              <label className="sr-only" htmlFor="app-language">
                {t.languageLabel}
              </label>
              <select
                id="app-language"
                value={language}
                onChange={(e) => setLanguage(e.target.value as Lang)}
                className={[
                  "h-10 min-w-[140px] cursor-pointer appearance-none rounded-[9999px] border border-[var(--color-tertiary-border)] bg-[var(--color-basics-white)]",
                  "py-0 pr-10 pl-4 font-sans text-[14px] font-medium text-foreground",
                  "shadow-[var(--shadow-sm)] transition-colors hover:border-[var(--color-grey-middle)]",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-300)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-beige-25)]",
                ].join(" ")}
              >
                {LANG_OPTIONS.map(({ code, label }) => (
                  <option key={code} value={code}>
                    {label}
                  </option>
                ))}
              </select>
              <IconChevronDown
                aria-hidden
                className="pointer-events-none absolute top-1/2 right-3 size-[18px] -translate-y-1/2 text-foreground"
                stroke={1.75}
              />
            </motion.div>
          </div>
          <motion.p
            className="m-0 mt-[var(--space-4)] max-w-[42rem] text-left text-[18px] leading-[1.45] text-foreground"
            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...tHero, delay: reduceMotion ? 0 : 0.18 }}
          >
            {t.subtitle}
          </motion.p>
        </motion.header>

        <Dialog
          open={showModal}
          onOpenChange={(open) => {
            setShowModal(open);
            setModalFieldErrors({});
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t.modalTitle}</DialogTitle>
              <DialogDescription>{t.modalDesc}</DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <ShadLabel htmlFor="custom-name">{t.nameLabel}</ShadLabel>
                <ShadInput
                  id="custom-name"
                  value={customPersona.name}
                  onChange={(e) => {
                    setCustomPersona((p) => ({ ...p, name: e.target.value }));
                    setModalFieldErrors((prev) => ({ ...prev, name: undefined }));
                  }}
                  placeholder={t.namePlaceholder}
                  aria-invalid={Boolean(modalFieldErrors.name)}
                  aria-describedby={modalFieldErrors.name ? "custom-name-error" : undefined}
                />
                <FieldError id="custom-name-error">{modalFieldErrors.name}</FieldError>
              </div>

              <div className="flex flex-col gap-2">
                <ShadLabel htmlFor="custom-desc">{t.descLabel}</ShadLabel>
                <ShadTextarea
                  id="custom-desc"
                  value={customPersona.description}
                  onChange={(e) => {
                    setCustomPersona((p) => ({ ...p, description: e.target.value }));
                    setModalFieldErrors((prev) => ({ ...prev, description: undefined }));
                  }}
                  placeholder={t.descPlaceholder}
                  rows={4}
                  aria-invalid={Boolean(modalFieldErrors.description)}
                  aria-describedby={modalFieldErrors.description ? "custom-desc-error" : undefined}
                />
                <FieldError id="custom-desc-error">{modalFieldErrors.description}</FieldError>
              </div>

              <div className="flex flex-col gap-2">
                <ShadLabel htmlFor="custom-traits">
                  {t.traitsLabel}
                  <span className="font-normal text-foreground"> {t.traitsSuffix}</span>
                </ShadLabel>
                <FieldHint id="custom-traits-hint">{t.traitsFieldHint}</FieldHint>
                <ShadInput
                  id="custom-traits"
                  value={customPersona.traits}
                  onChange={(e) => setCustomPersona((p) => ({ ...p, traits: e.target.value }))}
                  placeholder={t.traitsPlaceholder}
                  className="mt-1"
                  aria-describedby="custom-traits-hint"
                />
              </div>
            </div>

            <DialogFooter>
              <ShadButton variant="outline" onClick={() => setShowModal(false)}>
                {t.cancelBtn}
              </ShadButton>
              <ShadButton onClick={addCustom} disabled={!canAdd}>
                {t.createBtn}
              </ShadButton>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div
              key="step-0"
              className="flex flex-col gap-[var(--space-6)]"
              initial={reduceMotion ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: -12 }}
              transition={tStep}
            >
              <div className="flex flex-col gap-[var(--space-3)] sm:flex-row sm:items-center sm:justify-between">
                <p className="m-0 text-[14px] text-foreground">{counterText}</p>
                <ShadButton variant="secondary" onClick={() => setShowModal(true)} className="h-9 shrink-0 px-4 text-sm">
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                    <path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  {t.newBtn}
                </ShadButton>
              </div>

              <motion.ul
                className="m-0 grid list-none grid-cols-1 gap-[var(--space-5)] p-0 sm:grid-cols-2 lg:grid-cols-3"
                variants={{
                  hidden: {},
                  show: {
                    transition: {
                      staggerChildren: reduceMotion ? 0 : 0.05,
                      delayChildren: reduceMotion ? 0 : 0.06,
                    },
                  },
                }}
                initial="hidden"
                animate="show"
              >
                {displayPersonas.map((p) => (
                  <motion.li
                    key={p.id}
                    className="min-h-0"
                    variants={{
                      hidden: { opacity: 0, y: 14 },
                      show: { opacity: 1, y: 0 },
                    }}
                    transition={tStagger}
                  >
                    <PersonaCard
                      persona={p}
                      selected={selectedPersonas.includes(p.id)}
                      onToggle={toggle}
                      meta={t.personaMeta}
                    />
                  </motion.li>
                ))}
              </motion.ul>
              <div className="mx-auto flex w-full max-w-[480px] flex-col gap-[10px]">
                <ShadButton size="lg" onClick={() => setStep(1)} disabled={totalSelected === 0} className="w-full">
                  {t.nextBtn} ({totalSelected})
                </ShadButton>
              </div>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div
              key="step-1"
              className="mx-auto flex w-full max-w-[680px] flex-col gap-[var(--space-5)]"
              initial={reduceMotion ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: -12 }}
              transition={tStep}
            >
            <div>
              <ShadLabel htmlFor="flow-input">{t.linkLabel}</ShadLabel>
              <FieldHint id="flow-input-hint">{t.flowInputHint}</FieldHint>
              <ShadInput
                id="flow-input"
                value={flowInput}
                onChange={(e) => {
                  setFlowInput(e.target.value);
                  setFlowError(undefined);
                }}
                placeholder={t.linkPlaceholder}
                className="mt-1"
                aria-invalid={Boolean(flowError)}
                aria-describedby={
                  [flowError ? "flow-input-error" : "", "flow-input-hint"].filter(Boolean).join(" ") || undefined
                }
              />
              <FieldError id="flow-input-error">{flowError}</FieldError>
            </div>
            <div>
              <ShadLabel htmlFor="product-context">
                {t.contextLabel}{" "}
                <span className="font-normal text-foreground">{t.contextOptional}</span>
              </ShadLabel>
              <ShadTextarea
                id="product-context"
                value={productContext}
                onChange={(e) => setProductContext(e.target.value)}
                placeholder={t.contextPlaceholder}
                rows={7}
              />
            </div>
            <div className="flex flex-col items-stretch gap-[10px] self-center">
              <ShadButton
                onClick={() => {
                  if (!flowInput.trim()) {
                    setFlowError(t.validationFlowRequired);
                    return;
                  }
                  setFlowError(undefined);
                  setStep(2);
                  void run();
                }}
                className="h-10 w-full"
              >
                {t.launchBtn}
              </ShadButton>
              <ShadButton variant="outline" onClick={() => setStep(0)} className="h-10 w-full">
                {t.backBtn}
              </ShadButton>
            </div>
            </motion.div>
          )}

          {step === 2 && loading && (
            <motion.div
              key="step-2-loading"
              initial={reduceMotion ? false : { opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: -12 }}
              transition={tStep}
            >
              <ShadCard className="mx-auto w-full max-w-[680px] border border-[var(--color-tertiary-border)] p-0 shadow-xs">
            <div className="flex flex-col items-center gap-[28px] px-[var(--space-5)] py-[60px]">
              <style>{`@keyframes pSpin{to{transform:rotate(360deg)}}`}</style>
              <div className="flex w-[260px] flex-col gap-[14px]">
                <div className="flex items-center gap-[var(--space-3)]">
                  {loadingPhase === "fetching" ? (
                    <div className="size-[20px] shrink-0 animate-[pSpin_0.8s_linear_infinite] rounded-full border-2 border-[var(--color-grey-soft)] border-t-[var(--color-primary)]" />
                  ) : (
                    <div className="flex size-[20px] shrink-0 items-center justify-center rounded-full bg-[var(--color-accent-300)] text-[var(--color-basics-white)]">
                      <svg width="11" height="8" viewBox="0 0 11 8" fill="none" aria-hidden>
                        <path d="M1 4L4 7L10 1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  )}
                  <span
                    className={[
                      "text-[14px]",
                      loadingPhase === "fetching"
                        ? "font-semibold text-foreground no-underline"
                        : "font-normal text-[var(--color-palette-asfalt)] line-through",
                    ].join(" ")}
                  >
                    {t.fetchingPhase}
                  </span>
                </div>
                <div className="flex items-center gap-[var(--space-3)]">
                  {loadingPhase === "analyzing" ? (
                    <div className="size-[20px] shrink-0 animate-[pSpin_0.8s_linear_infinite] rounded-full border-2 border-[var(--color-grey-soft)] border-t-[var(--color-primary)]" />
                  ) : (
                    <div className="size-[20px] shrink-0 rounded-full border-2 border-[var(--color-grey-soft)]" />
                  )}
                  <span
                    className={[
                      "text-[14px]",
                      loadingPhase === "analyzing"
                        ? "font-semibold text-foreground"
                        : "font-normal text-foreground",
                    ].join(" ")}
                  >
                    {t.analyzingPhase}
                  </span>
                </div>
              </div>
              {loadingPhase === "analyzing" && progress.total > 0 && (
                <>
                  <div className="text-center">
                    <div className="text-[16px] font-semibold text-foreground">{progress.currentPersona}</div>
                    <div className="mt-1 text-[13px] text-foreground">
                      {t.userOf(progress.current, progress.total)}
                    </div>
                  </div>
                  <ShadProgress value={(progress.current / progress.total) * 100} className="w-[180px]" />
                </>
              )}
            </div>
            </ShadCard>
            </motion.div>
          )}

          {step === 3 && results && (
            <motion.div
              key="step-3-results"
              className="flex flex-col gap-[var(--space-5)]"
              initial={reduceMotion ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: -12 }}
              transition={tStep}
            >
              <motion.div
                className="grid grid-cols-2 gap-2.5 sm:grid-cols-4"
                variants={{
                  hidden: {},
                  show: {
                    transition: {
                      staggerChildren: reduceMotion ? 0 : 0.06,
                      delayChildren: reduceMotion ? 0 : 0.05,
                    },
                  },
                }}
                initial="hidden"
                animate="show"
              >
                {(
                  [
                    { label: t.scoreLabel, value: avg, variant: scoreToTier(avgScore) },
                    { label: t.issuesLabel, value: issueCount, variant: "warning" satisfies StatusVariant },
                    { label: t.criticalLabel, value: critCount, variant: "error" satisfies StatusVariant },
                    {
                      label: t.retentionLabel,
                      value: `${retainCount}/${results.length}`,
                      variant: "success" satisfies StatusVariant,
                    },
                  ] satisfies { label: string; value: string | number; variant: StatusVariant }[]
                ).map((m, i) => (
                  <motion.div
                    key={`${m.label}-${i}`}
                    variants={{
                      hidden: { opacity: 0, y: 12 },
                      show: { opacity: 1, y: 0 },
                    }}
                    transition={tStagger}
                  >
                    <MetricCard label={m.label} value={m.value} variant={m.variant} />
                  </motion.div>
                ))}
              </motion.div>
            <div className="flex flex-wrap items-center justify-between gap-[var(--space-3)]">
              <div className="text-base font-bold text-foreground">{t.resultsByUser}</div>
              <div className="flex flex-wrap gap-[var(--space-2)]">
                {ISSUE_FILTER_IDS.map((id) => (
                  <ShadButton
                    key={id}
                    onClick={() => setIssueCategoryFilter(id)}
                    variant={issueCategoryFilter === id ? "default" : "outline"}
                    size="sm"
                    className="rounded-full"
                  >
                    {t.issueFilterLabels[id]}
                  </ShadButton>
                ))}
              </div>
            </div>
            <motion.div
              className="flex flex-col gap-[var(--space-5)]"
              variants={{
                hidden: {},
                show: {
                  transition: { staggerChildren: reduceMotion ? 0 : 0.07, delayChildren: reduceMotion ? 0 : 0.12 },
                },
              }}
              initial="hidden"
              animate="show"
            >
              {results.map((r, i) => (
                <motion.div
                  key={r.personaId ?? i}
                  variants={{
                    hidden: { opacity: 0, y: 16 },
                    show: { opacity: 1, y: 0 },
                  }}
                  transition={tStagger}
                >
                  <ResultCard
                    result={r}
                    index={i}
                    labels={resultCardLabels}
                    issueCategoryFilter={issueCategoryFilter}
                    personas={displayPersonas}
                  />
                </motion.div>
              ))}
            </motion.div>
            <div className="mt-[var(--space-2)] flex flex-col items-stretch gap-[10px] self-center">
              <ShadButton
                onClick={() => {
                  setStep(0);
                  setResults(null);
                }}
                className="w-full rounded-full"
              >
                {t.newTestBtn}
              </ShadButton>
              <ShadButton
                variant="secondary"
                onClick={() => {
                  setStep(1);
                  setResults(null);
                }}
                className="w-full rounded-full"
              >
                {t.editFlowBtn}
              </ShadButton>
            </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
