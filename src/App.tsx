import { useState, useCallback, useMemo, useEffect } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { Persona, SimulationResult } from "@/types";
import type { IssueCategory } from "@/domain/simulation";
import { PRESET_PERSONAS } from "@/lib/personas";
import { appendSimulation } from "@/lib/storage";
import { t, pickResultCardLabels } from "@/lib/i18n";
import { useRunSimulation } from "@/hooks/useRunSimulation";
import { useLiveElapsedMs } from "@/hooks/useLiveElapsedMs";
import {
  aggregateSimulationResults,
  buildCustomPersonaFromForm,
  canAddPersonaSelection,
  countSelectionByCategory,
  personaSelectionLabel,
  validateCustomPersonaForm,
} from "@/lib/app-lab";
import { scoreToTier, type StatusVariant } from "@/lib/ui-status";
import { MetricCard } from "@/components/ds/metric-card";
import { AddPersonaEmptyCard } from "@/components/ds/add-persona-empty-card";
import { Avatar } from "@/components/ds/avatar";
import { PersonaCard } from "@/components/ds/persona-card";
import { PersonaResultTabs } from "@/components/ds/persona-result-tabs";
import { ResultCard } from "@/components/ds/result-card";
import { IconPencil } from "@tabler/icons-react";

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
import { FieldError } from "@/components/ui/field-error";
import { FieldHint } from "@/components/ui/field-hint";
import { FlowBottomBar } from "@/components/FlowBottomBar";
import { SiteFooter } from "@/components/SiteFooter";
import { Banner1 } from "@/components/pro-blocks/landing-page/banners/banner-1";
import { SiteNavbar } from "@/components/SiteNavbar";

const ISSUE_FILTER_IDS = ["all", "ux", "ui", "product", "copy"] as const;
const PERSONA_GROUP_ORDER = ["region", "industry", "accessibility", "core", "custom"] as const;
const PERSONA_SORT_GROUPS = ["region", "industry", "accessibility"] as const;
type PersonaSortMode = "default" | (typeof PERSONA_SORT_GROUPS)[number];

const PERSONA_GROUP_LABELS: Record<Persona["group"], string> = {
  region: "By region",
  industry: "By industry",
  accessibility: "Accessibility",
  core: "Core",
  custom: "Custom",
};

const SORT_LABELS = { label: "Sort by", default: "Default" } as const;

const easeOut = [0.22, 1, 0.36, 1] as const;

const RESULT_PERSONA_TABPANEL_ID = "result-persona-tabpanel";

function fallbackPersonaForTab(personaId: string): Persona {
  return {
    id: personaId,
    name: personaId,
    initials: "?",
    avatarBg: "var(--color-accent-100)",
    avatarColor: "var(--color-accent-700)",
    category: "simple",
    group: "custom",
    description: "",
    traits: [],
    frustration: "low",
    techLevel: "medium",
  };
}

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
  const livePhaseMs = useLiveElapsedMs(loading ? progress.currentPhaseStartAt : null);
  const [showModal, setShowModal] = useState(false);
  const [issueCategoryFilter, setIssueCategoryFilter] = useState<"all" | IssueCategory>("all");
  const [personaSortMode, setPersonaSortMode] = useState<PersonaSortMode>("default");
  const [flowError, setFlowError] = useState<string | undefined>();
  const [modalFieldErrors, setModalFieldErrors] = useState<{ name?: string; description?: string }>({});
  const [selectedResultsPersonaId, setSelectedResultsPersonaId] = useState<string | null>(null);
  const resultCardLabels = pickResultCardLabels(t);

  const loadingProgressPercent = useMemo(() => {
    const totalPersonas = progress.total;
    if (totalPersonas <= 0) return 0;

    const totalUnits = totalPersonas * 2; // objective_analysis + persona_simulation per persona
    const minFetchingPercent = 6;
    const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

    if (loadingPhase === "fetching") return minFetchingPercent;

    const personaIndex = progress.current; // 1..N
    if (personaIndex <= 0) return 0;

    const completedPersonas = personaIndex - 1;
    const hasActivePhaseStart = progress.currentPhaseStartAt != null;

    const DEFAULT_OBJECTIVE_MS = 20000;
    const DEFAULT_PERSONA_MS = 40000;

    if (loadingPhase === "analyzing_objective") {
      const completedObjectiveCount = Math.max(0, completedPersonas);
      const avgObjectiveMs =
        completedObjectiveCount > 0 ? progress.phaseDurationsMs.objective_analysis / completedObjectiveCount : DEFAULT_OBJECTIVE_MS;

      const fraction = hasActivePhaseStart ? clamp(livePhaseMs / avgObjectiveMs, 0, 1) : 1;
      const doneUnits = completedPersonas * 2 + fraction;
      return (doneUnits / totalUnits) * 100;
    }

    if (loadingPhase === "analyzing_persona") {
      const completedPersonaSimCount = Math.max(0, completedPersonas);
      const avgPersonaMs =
        completedPersonaSimCount > 0
          ? progress.phaseDurationsMs.persona_simulation / completedPersonaSimCount
          : DEFAULT_PERSONA_MS;

      // If we momentarily have no active timestamp, the phase is already completed.
      const fraction = hasActivePhaseStart ? clamp(livePhaseMs / avgPersonaMs, 0, 1) : 1;
      const doneUnits = completedPersonas * 2 + 1 + fraction; // +1 because objective for current persona is complete
      return (doneUnits / totalUnits) * 100;
    }

    return 0;
  }, [
    loadingPhase,
    livePhaseMs,
    progress.current,
    progress.currentPhaseStartAt,
    progress.phaseDurationsMs.objective_analysis,
    progress.phaseDurationsMs.persona_simulation,
    progress.total,
  ]);
  const sortedPersonas = useMemo(() => {
    if (personaSortMode === "default") return personas;
    const selectedGroup: Persona["group"] = personaSortMode;
    const baseOrder = PERSONA_GROUP_ORDER.filter((group) => group !== selectedGroup);
    const rank = new Map<Persona["group"], number>([[selectedGroup, 0]]);
    baseOrder.forEach((group, index) => rank.set(group, index + 1));
    return [...personas].sort((a, b) => {
      const groupDelta = (rank.get(a.group) ?? 99) - (rank.get(b.group) ?? 99);
      if (groupDelta !== 0) return groupDelta;
      return a.name.localeCompare(b.name);
    });
  }, [personas, personaSortMode]);

  const loadingOrderedPersonas = useMemo(() => {
    return selectedPersonas
      .map((id) => personas.find((p) => p.id === id))
      .filter((p): p is Persona => p != null);
  }, [selectedPersonas, personas]);
  const flowSelectedPersonas = loadingOrderedPersonas;

  const toggle = (id: string) =>
    setSelectedPersonas((p) => {
      if (p.includes(id)) return p.filter((x) => x !== id);
      if (!canAddPersonaSelection(p.length)) return p;
      return [...p, id];
    });
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
    setSelectedPersonas((p) => (canAddPersonaSelection(p.length) ? [...p, id] : p));
    setCustomPersona({ name: "", description: "", traits: "" });
    setShowModal(false);
  };

  const resetToInitialState = useCallback(() => {
    setStep(0);
    setSelectedPersonas([]);
    setFlowInput("");
    setProductContext("");
    setResults(null);
    setIssueCategoryFilter("all");
    setSelectedResultsPersonaId(null);
    setFlowError(undefined);
    setShowModal(false);
    setModalFieldErrors({});
  }, []);

  const goToEditFlow = useCallback(() => {
    setStep(1);
    setResults(null);
  }, []);

  const run = useCallback(async () => {
    setResults(null);
    setIssueCategoryFilter("all");
    const selectedPersonaRecords = personas.filter((p) => selectedPersonas.includes(p.id));
    const { results: all, prepared } = await runSimulation({
      flowInput,
      productContext,
      selectedPersonas: selectedPersonaRecords,
      analysisMode: "max",
    });
    setResults(all);
    appendSimulation({
      flowInput: flowInput.trim(),
      sourceType: prepared.sourceType,
      productContext,
      language: "en",
      personaIds: selectedPersonaRecords.map((p) => p.id),
      results: all,
      personasSnapshot: selectedPersonaRecords,
      analysisMode: "max",
    });
    setStep(3);
  }, [selectedPersonas, flowInput, productContext, personas, runSimulation]);

  const { avgScore, issueCount, critCount, retainCount } = aggregateSimulationResults(results);

  useEffect(() => {
    if (!results?.length) return;
    setSelectedResultsPersonaId((prev) => {
      if (prev && results.some((r) => r.personaId === prev)) return prev;
      return results[0].personaId;
    });
  }, [results]);

  const personaResultTabItems = useMemo(() => {
    if (!results?.length) return [];
    return results.map((r) => ({
      personaId: r.personaId,
      persona: personas.find((p) => p.id === r.personaId) ?? fallbackPersonaForTab(r.personaId),
    }));
  }, [results, personas]);

  const tabSelectedPersonaId = useMemo(() => {
    if (!results?.length) return "";
    if (selectedResultsPersonaId && results.some((r) => r.personaId === selectedResultsPersonaId)) {
      return selectedResultsPersonaId;
    }
    return results[0].personaId;
  }, [results, selectedResultsPersonaId]);

  const selectedResultForPersonaTab = useMemo(() => {
    if (!results?.length || !tabSelectedPersonaId) return null;
    return results.find((r) => r.personaId === tabSelectedPersonaId) ?? null;
  }, [results, tabSelectedPersonaId]);

  const tStep = reduceMotion ? { duration: 0 } : { duration: 0.32, ease: easeOut };
  const tHero = reduceMotion ? { duration: 0 } : { duration: 0.45, ease: easeOut };
  const tStagger = reduceMotion ? { duration: 0 } : { duration: 0.28, ease: easeOut };

  const showFlowBottomBar =
    (step === 0 && totalSelected > 0) || step === 1;

  const isLoadingStep = step === 2 && loading;

  return (
    <div className="relative z-[1] flex min-h-[100vh] flex-col font-sans text-foreground antialiased">
      <Banner1 t={t} />
      {!isLoadingStep ? <SiteNavbar t={t} onLogoClick={resetToInitialState} /> : null}
      <div
        className={[
          "relative flex-1 px-[var(--space-5)] py-[var(--space-10)] md:px-[var(--space-8)]",
          showFlowBottomBar ? "pb-[calc(var(--space-10)+5.5rem)]" : "",
          isLoadingStep ? "flex flex-col justify-center py-[var(--space-6)]" : "",
        ].join(" ")}
      >
        <div className="relative mx-auto w-full max-w-[1200px]">
        {!isLoadingStep ? (
          <motion.header
            className="relative z-[1] mb-[36px] w-full"
            initial={reduceMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={tHero}
          >
            <motion.h1
              className="m-0 w-full text-center text-[clamp(2.5rem,10vw,5rem)] font-normal leading-[1.05] tracking-[-0.02em] text-foreground md:text-[80px]"
              style={{ fontFamily: "var(--font-serif)" }}
              initial={reduceMotion ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...tHero, delay: reduceMotion ? 0 : 0.1 }}
            >
              {t.appTitle}
            </motion.h1>
            <motion.p
              className="m-0 mx-auto mt-[var(--space-4)] max-w-[42rem] text-center text-[18px] leading-[1.45] text-foreground"
              initial={reduceMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...tHero, delay: reduceMotion ? 0 : 0.18 }}
            >
              {t.subtitle}
            </motion.p>
          </motion.header>
        ) : null}

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
              <div className="mx-[var(--space-1)] flex flex-wrap items-center justify-between gap-[var(--space-3)] md:mx-0">
                <p className="m-0 text-[14px] text-foreground">{counterText}</p>
                <div className="inline-flex items-center gap-2 text-[13px] text-foreground">
                  <span>{SORT_LABELS.label}</span>
                  <label className="relative">
                    <select
                      value={personaSortMode}
                      onChange={(e) => setPersonaSortMode(e.target.value as PersonaSortMode)}
                      className="h-9 appearance-none rounded-[var(--radius-full)] border border-[var(--color-tertiary-border)] bg-[var(--color-beige-25)] py-0 pr-9 pl-3 text-[13px] font-medium text-foreground outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--color-accent-300)]"
                    >
                      <option value="default">{SORT_LABELS.default}</option>
                      {PERSONA_SORT_GROUPS.map((group) => (
                        <option key={group} value={group}>
                          {PERSONA_GROUP_LABELS[group]}
                        </option>
                      ))}
                    </select>
                    <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-foreground/70" aria-hidden>
                      <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                        <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                  </label>
                </div>
              </div>

              <motion.ul
                className="m-0 grid list-none grid-cols-1 gap-[var(--space-5)] px-[var(--space-1)] py-0 sm:grid-cols-2 md:px-0 lg:grid-cols-3"
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
                {sortedPersonas.map((p) => (
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
                      selectionDisabled={!selectedPersonas.includes(p.id) && !canAddPersonaSelection(totalSelected)}
                      selectionLimitTitle={t.selectionLimitReachedTitle}
                    />
                  </motion.li>
                ))}
                <motion.li
                  key="add-persona-empty"
                  className="min-h-0"
                  variants={{
                    hidden: { opacity: 0, y: 14 },
                    show: { opacity: 1, y: 0 },
                  }}
                  transition={tStagger}
                >
                  <AddPersonaEmptyCard
                    title={t.createBtn}
                    hint={t.modalDesc}
                    onClick={() => setShowModal(true)}
                    disabled={!canAddPersonaSelection(totalSelected)}
                    disabledHint={t.selectionLimitHintAddCard}
                  />
                </motion.li>
              </motion.ul>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div
              key="step-1"
              className="mx-auto flex w-full max-w-[680px] flex-col gap-6"
              initial={reduceMotion ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: -12 }}
              transition={tStep}
            >
              <div className="flex flex-col items-center gap-9 text-center">
                <h2 className="m-0 text-[16px] font-bold leading-[1.15] text-foreground">
                  {t.flowStepTitle}
                </h2>
                {flowSelectedPersonas.length > 0 ? (
                  <div className="w-full max-w-[520px]">
                    <ul className="m-0 flex w-full list-none flex-wrap gap-2 p-0" aria-label={t.flowSelectedHeading}>
                      {flowSelectedPersonas.map((p) => (
                        <li
                          key={p.id}
                          className="flex h-[40px] max-w-[min(100%,220px)] items-center gap-2 rounded-[var(--radius-full)] border border-[var(--color-tertiary-border)] bg-[var(--color-basics-white)] px-[12px] py-[8px]"
                        >
                          <Avatar persona={p} size={24} border="1px solid var(--color-primary)" />
                          <span className="min-w-0 truncate text-[14px] font-bold text-foreground">{p.name}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>

              <div className="mx-auto flex w-full max-w-[520px] flex-col gap-7">
                <div>
                  <ShadLabel htmlFor="flow-input" className="text-[16px] font-semibold text-foreground">
                    {t.linkLabel}
                  </ShadLabel>
                  <FieldHint id="flow-input-hint" className="mt-2 text-[16px] text-foreground/70">
                    {t.flowInputHint}
                  </FieldHint>
                  <ShadInput
                    id="flow-input"
                    value={flowInput}
                    onChange={(e) => {
                      setFlowInput(e.target.value);
                      setFlowError(undefined);
                    }}
                    placeholder={t.linkPlaceholder}
                    className="mt-2 h-14 rounded-[8px] border-0 bg-[var(--color-basics-white)] px-4 shadow-none placeholder:text-foreground/80 focus-visible:border-[var(--color-accent-300)]"
                    aria-invalid={Boolean(flowError)}
                    aria-describedby={
                      [flowError ? "flow-input-error" : "", "flow-input-hint"].filter(Boolean).join(" ") || undefined
                    }
                  />
                  <FieldError id="flow-input-error">{flowError}</FieldError>
                </div>
                <div>
                  <ShadLabel htmlFor="product-context" className="text-[16px] font-semibold text-foreground">
                    {t.contextLabel}{" "}
                    <span className="font-normal text-foreground">{t.contextOptional}</span>
                  </ShadLabel>
                  <FieldHint id="product-context-hint" className="mt-2 text-[16px] text-foreground/70">
                    {t.contextHint}
                  </FieldHint>
                  <ShadTextarea
                    id="product-context"
                    value={productContext}
                    onChange={(e) => setProductContext(e.target.value)}
                    placeholder={t.contextPlaceholder}
                    rows={7}
                    className="mt-2 min-h-[190px] rounded-[8px] border-0 bg-[var(--color-basics-white)] px-4 py-3 shadow-none placeholder:text-foreground/80 focus-visible:border-[var(--color-accent-300)]"
                    aria-describedby="product-context-hint"
                  />
                </div>
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
              <div
                role="progressbar"
                aria-label={t.loadingProgressAriaLabel}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(loadingProgressPercent)}
                className="h-[10px] w-full overflow-hidden rounded-[9999px] bg-[var(--color-grey-soft)]"
              >
                <div
                  className="h-full rounded-[9999px] bg-[var(--color-primary)] transition-[width] duration-150 ease-linear"
                  style={{ width: `${Math.round(loadingProgressPercent)}%` }}
                />
              </div>
              {loadingOrderedPersonas.length > 0 ? (
                <div className="flex w-full max-w-[420px] flex-col items-center gap-[var(--space-3)]">
                  <p className="m-0 text-center text-[11px] font-bold tracking-[0.05em] text-foreground uppercase">
                    {t.loadingSelectedHeading}
                  </p>
                  <ul
                    className="m-0 flex w-full list-none flex-wrap justify-center gap-2 p-0"
                    aria-label={t.loadingSelectedHeading}
                  >
                    {loadingOrderedPersonas.map((p) => (
                      <li
                        key={p.id}
                        className="flex max-w-[min(100%,220px)] items-center gap-2 rounded-[var(--radius-full)] bg-[var(--color-beige-50)] py-1 pr-[var(--space-3)] pl-1"
                      >
                        <Avatar persona={p} size={28} />
                        <span className="min-w-0 truncate text-[13px] font-medium text-foreground">{p.name}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              <p className="m-0 max-w-[32rem] text-center text-[14px] leading-relaxed text-foreground/75">
                {t.loadingPatienceNote}
              </p>
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
                  {loadingPhase === "analyzing_objective" || loadingPhase === "analyzing_persona" ? (
                    <div className="size-[20px] shrink-0 animate-[pSpin_0.8s_linear_infinite] rounded-full border-2 border-[var(--color-grey-soft)] border-t-[var(--color-primary)]" />
                  ) : (
                    <div className="size-[20px] shrink-0 rounded-full border-2 border-[var(--color-grey-soft)]" />
                  )}
                  <span
                    className={[
                      "text-[14px]",
                      loadingPhase === "analyzing_objective" || loadingPhase === "analyzing_persona"
                        ? "font-semibold text-foreground"
                        : "font-normal text-foreground",
                    ].join(" ")}
                  >
                    {t.analyzingPhase}
                  </span>
                </div>
              </div>
              {(loadingPhase === "analyzing_objective" || loadingPhase === "analyzing_persona") && progress.total > 0 && (
                <>
                  <div className="text-center">
                    <div className="text-[16px] font-semibold text-foreground">{progress.currentPersona}</div>
                    <div className="mt-1 text-[13px] text-foreground">
                      {t.userOf(progress.current, progress.total)}
                    </div>
                    <div className="mt-1 text-[12px] text-foreground/80">
                      {progress.currentPersonaPhase === "objective_analysis"
                        ? t.loadingPhaseObjective
                        : t.loadingPhasePersona}
                    </div>
                  </div>
                  <div
                    className="text-center text-[12px] text-foreground/80"
                    aria-live="polite"
                    aria-atomic="false"
                  >
                    <div>
                      {t.loadingObjectiveTimeLabel}{" "}
                      {(
                        (progress.phaseDurationsMs.objective_analysis +
                          (progress.currentPersonaPhase === "objective_analysis" ? livePhaseMs : 0)) /
                        1000
                      ).toFixed(1)}
                      s
                    </div>
                    <div>
                      {t.loadingPersonaTimeLabel}{" "}
                      {(
                        (progress.phaseDurationsMs.persona_simulation +
                          (progress.currentPersonaPhase === "persona_simulation" ? livePhaseMs : 0)) /
                        1000
                      ).toFixed(1)}
                      s
                    </div>
                  </div>
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
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-[18px] leading-none font-semibold tracking-[-0.01em] text-foreground">
                  {t.resultsByUser}
                </div>
                {results && results.length > 0 ? (
                  <button
                    type="button"
                    onClick={goToEditFlow}
                    className="inline-flex items-center gap-1.5 text-[14px] font-medium text-[var(--color-primary)] underline underline-offset-4 transition-opacity hover:opacity-80"
                  >
                    <IconPencil aria-hidden className="size-[18px] shrink-0" stroke={1.5} />
                    {t.editFlowBtn}
                  </button>
                ) : null}
              </div>
              <motion.div
                className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5"
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
                    {
                      label: t.usersLabel,
                      value: results.length,
                      variant: "success" satisfies StatusVariant,
                      kind: "users" as const,
                    },
                    { label: t.scoreLabel, value: Math.round(avgScore), variant: scoreToTier(avgScore), kind: "default" as const },
                    { label: t.issuesLabel, value: issueCount, variant: "warning" satisfies StatusVariant, kind: "default" as const },
                    { label: t.criticalLabel, value: critCount, variant: "error" satisfies StatusVariant, kind: "default" as const },
                    {
                      label: t.retentionLabel,
                      value: `${retainCount}/${results.length}`,
                      variant: "success" satisfies StatusVariant,
                      kind: "default" as const,
                    },
                  ] satisfies { label: string; value: string | number; variant: StatusVariant; kind: "default" | "users" }[]
                ).map((m, i) => (
                  <motion.div
                    key={`${m.label}-${i}`}
                    variants={{
                      hidden: { opacity: 0, y: 12 },
                      show: { opacity: 1, y: 0 },
                    }}
                    transition={tStagger}
                  >
                    <MetricCard
                      label={m.label}
                      value={m.value}
                      variant={m.variant}
                      kind={m.kind}
                      personas={m.kind === "users" ? loadingOrderedPersonas : undefined}
                    />
                  </motion.div>
                ))}
              </motion.div>
              {personaResultTabItems.length > 0 && tabSelectedPersonaId ? (
                <PersonaResultTabs
                  items={personaResultTabItems}
                  selectedId={tabSelectedPersonaId}
                  onSelect={setSelectedResultsPersonaId}
                  tabPanelId={RESULT_PERSONA_TABPANEL_ID}
                  tablistLabel={t.usersLabel}
                />
              ) : null}
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
              {selectedResultForPersonaTab ? (
                <motion.div
                  key={selectedResultForPersonaTab.personaId}
                  variants={{
                    hidden: { opacity: 0, y: 16 },
                    show: { opacity: 1, y: 0 },
                  }}
                  transition={tStagger}
                >
                  <div
                    role="tabpanel"
                    id={RESULT_PERSONA_TABPANEL_ID}
                    aria-labelledby={`result-tab-${tabSelectedPersonaId}`}
                  >
                    <ResultCard
                      variant="panel"
                      result={selectedResultForPersonaTab}
                      index={0}
                      labels={resultCardLabels}
                      issueCategoryFilter={issueCategoryFilter}
                      personas={personas}
                      issueFilterOptions={ISSUE_FILTER_IDS.map((id) => ({
                        id,
                        label: t.issueFilterLabels[id],
                      }))}
                      onIssueCategoryFilterChange={(v) => setIssueCategoryFilter(v)}
                    />
                  </div>
                </motion.div>
              ) : null}
            </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        </div>
      </div>

      {!isLoadingStep ? <SiteFooter reserveSpaceForOverlay={showFlowBottomBar} /> : null}

      {showFlowBottomBar && (
        <FlowBottomBar
          step={step}
          totalSteps={2}
          selectedCount={totalSelected}
          backLabel={t.backBtn}
          primaryLabel={
            step === 0
              ? `${t.nextBtn} (${totalSelected})`
              : t.launchBtn
          }
          primaryDisabled={step === 1 && !flowInput.trim()}
          onNext={() => {
            if (step === 0) {
              setStep(1);
              return;
            }
            if (!flowInput.trim()) {
              setFlowError(t.validationFlowRequired);
              return;
            }
            setFlowError(undefined);
            setStep(2);
            void run();
          }}
          onBack={() => {
            if (step === 1) setStep(0);
          }}
        />
      )}
    </div>
  );
}
