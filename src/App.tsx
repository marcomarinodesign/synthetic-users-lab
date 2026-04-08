import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { Persona, SimulationResult } from "@/types";
import type { IssueCategory } from "@/domain/simulation";
import { PRESET_PERSONAS } from "@/lib/personas";
import { appendSimulation, deleteSimulation, loadSimulationHistory, type SavedSimulation } from "@/lib/storage";
import { trackSimulationStarted, trackSimulationCompleted, trackExportResults } from "@/lib/analytics";
import { t, pickResultCardLabels } from "@/lib/i18n";
import {
  fetchMetadataResult,
  isValidHttpUrl,
  MetadataFetchError,
  type ExtractedFieldId,
} from "@/lib/metaExtractor";
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
import { ExportButton } from "@/components/ds/export-button";
import { FlowUrlField } from "@/components/ds/flow-url-field";
import { ProductContextField } from "@/components/ds/product-context-field";
import { IconPencil } from "@tabler/icons-react";

import { Button as ShadButton } from "@/components/ui/button";
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
import { SimulationHistoryPanel } from "@/components/ds/simulation-history-panel";
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
  const [urlEnrichError, setUrlEnrichError] = useState<string | undefined>();
  const [metaEnrichPending, setMetaEnrichPending] = useState(false);
  const [extractedMetadataFields, setExtractedMetadataFields] = useState<ExtractedFieldId[]>([]);
  const enrichInflightRef = useRef(false);
  const lastSuccessfulEnrichUrlRef = useRef<string | null>(null);
  const [modalFieldErrors, setModalFieldErrors] = useState<{ name?: string; description?: string }>({});
  const [simulationHistory, setSimulationHistory] = useState<SavedSimulation[]>(() => loadSimulationHistory());
  const [activeSavedId, setActiveSavedId] = useState<string | null>(null);
  const [baselineSimId, setBaselineSimId] = useState<string | null>(null);
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
    setUrlEnrichError(undefined);
    setMetaEnrichPending(false);
    setExtractedMetadataFields([]);
    lastSuccessfulEnrichUrlRef.current = null;
    setShowModal(false);
    setModalFieldErrors({});
    setActiveSavedId(null);
    setBaselineSimId(null);
  }, []);

  const restoreSimulation = useCallback((entry: SavedSimulation) => {
    setFlowInput(entry.flowInput);
    setProductContext(entry.productContext);
    setResults(entry.results);
    setIssueCategoryFilter("all");
    setSelectedResultsPersonaId(entry.results[0]?.personaId ?? null);
    if (entry.personasSnapshot?.length) {
      setPersonas((prev) => {
        const existingIds = new Set(prev.map((p) => p.id));
        const newOnes = entry.personasSnapshot!.filter((p) => !existingIds.has(p.id));
        return newOnes.length > 0 ? [...prev, ...newOnes] : prev;
      });
    }
    setSelectedPersonas(entry.personaIds);
    setActiveSavedId(entry.id);
    setBaselineSimId(null);
    setStep(3);
  }, []);

  const removeFromHistory = useCallback((id: string) => {
    deleteSimulation(id);
    setSimulationHistory(loadSimulationHistory());
  }, []);

  const clearUrlDerivedHints = useCallback(() => {
    setUrlEnrichError(undefined);
    setExtractedMetadataFields([]);
    lastSuccessfulEnrichUrlRef.current = null;
  }, []);

  const canEnrichUrl = useMemo(() => isValidHttpUrl(flowInput.trim()), [flowInput]);

  const tryEnrich = useCallback(
    async (opts?: { force?: boolean }) => {
      const url = flowInput.trim();
      if (!isValidHttpUrl(url)) return;
      if (enrichInflightRef.current) return;
      if (!opts?.force && lastSuccessfulEnrichUrlRef.current === url) return;

      enrichInflightRef.current = true;
      setMetaEnrichPending(true);
      setUrlEnrichError(undefined);

      try {
        const result = await fetchMetadataResult(url);
        setProductContext(result.text);
        setExtractedMetadataFields([...result.extractedFields]);
        lastSuccessfulEnrichUrlRef.current = url;
      } catch (e) {
        const fallback = t.urlEnrichError;
        if (e instanceof MetadataFetchError) {
          const m = e.message.trim();
          setUrlEnrichError(!m || m === "Failed to fetch page metadata" ? fallback : m);
        } else {
          setUrlEnrichError(fallback);
        }
      } finally {
        enrichInflightRef.current = false;
        setMetaEnrichPending(false);
      }
    },
    [flowInput]
  );

  const goToEditFlow = useCallback(() => {
    setStep(1);
    setResults(null);
  }, []);

  const run = useCallback(async () => {
    setResults(null);
    setIssueCategoryFilter("all");
    const selectedPersonaRecords = personas.filter((p) => selectedPersonas.includes(p.id));
    trackSimulationStarted({
      personas_count: selectedPersonaRecords.length,
      source_type: isValidHttpUrl(flowInput.trim())
        ? flowInput.trim().includes("github.com") ? "repo" : "url"
        : "description",
    });
    const { results: all, prepared } = await runSimulation({
      flowInput,
      productContext,
      selectedPersonas: selectedPersonaRecords,
      analysisMode: "max",
    });
    setResults(all);
    const { avgScore: completedAvgScore, issueCount: completedIssueCount, critCount: completedCritCount } = aggregateSimulationResults(all);
    trackSimulationCompleted({
      personas_count: all.length,
      avg_score: Math.round(completedAvgScore),
      issues_count: completedIssueCount,
      critical_count: completedCritCount,
    });
    const saved = appendSimulation({
      flowInput: flowInput.trim(),
      sourceType: prepared.sourceType,
      productContext,
      language: "en",
      personaIds: selectedPersonaRecords.map((p) => p.id),
      results: all,
      personasSnapshot: selectedPersonaRecords,
      analysisMode: "max",
    });
    setSimulationHistory(loadSimulationHistory());
    setActiveSavedId(saved.id);
    setBaselineSimId(null);
    setStep(3);
  }, [selectedPersonas, flowInput, productContext, personas, runSimulation]);

  const { avgScore, issueCount, critCount, retainCount } = aggregateSimulationResults(results);

  const baselineCandidates = useMemo(
    () => simulationHistory.filter((e) => e.id !== activeSavedId),
    [simulationHistory, activeSavedId]
  );

  const baselineEntry = useMemo(
    () => baselineCandidates.find((e) => e.id === baselineSimId) ?? null,
    [baselineCandidates, baselineSimId]
  );

  const baselineAgg = useMemo(
    () => (baselineEntry ? aggregateSimulationResults(baselineEntry.results) : null),
    [baselineEntry]
  );

  const metricDeltas = useMemo(() => {
    if (!baselineAgg) return null;
    return {
      score: Math.round(avgScore) - Math.round(baselineAgg.avgScore),
      issues: issueCount - baselineAgg.issueCount,
      crits: critCount - baselineAgg.critCount,
      retain: retainCount - baselineAgg.retainCount,
    };
  }, [baselineAgg, avgScore, issueCount, critCount, retainCount]);

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
              </motion.ul>
              <SimulationHistoryPanel
                history={simulationHistory}
                onRestore={restoreSimulation}
                onDelete={removeFromHistory}
              />
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
                <FlowUrlField
                  id="flow-input"
                  hintId="flow-input-hint"
                  value={flowInput}
                  onChange={(e) => {
                    setFlowInput(e.target.value);
                    setFlowError(undefined);
                  }}
                  onClearEnrichError={clearUrlDerivedHints}
                  label={t.linkLabel}
                  hint={t.flowInputHint}
                  placeholder={t.linkPlaceholder}
                  validationError={flowError}
                  enrichError={urlEnrichError}
                  onEnrichRequest={tryEnrich}
                  disabled={metaEnrichPending}
                />
                <ProductContextField
                  id="product-context"
                  hintId="product-context-hint"
                  value={productContext}
                  onChange={(e) => setProductContext(e.target.value)}
                  label={t.contextLabel}
                  hint={t.contextHint}
                  placeholder={t.contextPlaceholder}
                  rows={7}
                  autoFillLabel={t.contextAutoFillBtn}
                  autoFillLoadingLabel={t.contextAutoFillLoading}
                  autoFillBusyLabel={t.contextAutoFillBusy}
                  onAutoFill={() => void tryEnrich({ force: true })}
                  autoFillPending={metaEnrichPending}
                  canAutoFill={canEnrichUrl}
                  extractedFields={extractedMetadataFields}
                  chipLabels={{
                    product: t.metaChipProduct,
                    description: t.metaChipDescription,
                    mainHeading: t.metaChipMainHeading,
                    keySections: t.metaChipKeySections,
                    keywords: t.metaChipKeywords,
                  }}
                />
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
              <style>{`@keyframes pSpin{to{transform:rotate(360deg)}}`}</style>
              <div className="mx-auto w-full max-w-[680px] rounded-[8px] bg-[#f6f7f9]">
                <div className="flex flex-col items-center gap-[24px] px-[var(--space-5)] py-[60px]">

                  {/* Selected profiles heading */}
                  <p className="m-0 text-center text-[14px] font-semibold uppercase tracking-[2px] text-[#1c1412]">
                    {t.loadingSelectedHeading}
                  </p>

                  {/* Persona chips */}
                  {loadingOrderedPersonas.length > 0 && (
                    <ul
                      className="m-0 flex list-none flex-wrap justify-center gap-2 p-0 py-[8px]"
                      aria-label={t.loadingSelectedHeading}
                    >
                      {loadingOrderedPersonas.map((p) => (
                        <li
                          key={p.id}
                          className="flex items-center gap-2 rounded-[48px] bg-white px-[12px] py-[8px]"
                        >
                          <Avatar persona={p} size={24} border="0.48px solid #1c1412" />
                          <span className="text-[14px] font-bold text-[#1c1412]">{p.name}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* Progress bar */}
                  <div
                    role="progressbar"
                    aria-label={t.loadingProgressAriaLabel}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Math.round(loadingProgressPercent)}
                    className="relative h-[10px] w-full overflow-hidden rounded-[100px]"
                  >
                    <div className="absolute inset-0 rounded-[100px] bg-[#1c1412] opacity-5" />
                    <div
                      className="absolute inset-y-0 left-0 rounded-[100px] bg-[#5f90f1] transition-[width] duration-150 ease-linear"
                      style={{ width: `${Math.round(loadingProgressPercent)}%` }}
                    />
                  </div>

                  {/* Profile details (shown while analyzing) */}
                  {(loadingPhase === "analyzing_objective" || loadingPhase === "analyzing_persona") && progress.total > 0 && (
                    <div className="flex w-full flex-col gap-[8px] text-center text-[16px] leading-[24px] text-[#1c1412]">
                      <p className="m-0 font-bold">
                        {progress.currentPersona} ({t.userOf(progress.current, progress.total)})
                      </p>
                      <p className="m-0 font-normal">{t.loadingPatienceNote}</p>
                    </div>
                  )}

                  {/* Fetching step row */}
                  <div
                    className={[
                      "flex w-full items-center gap-[8px] rounded-[8px] bg-white p-[12px] transition-opacity duration-200",
                      loadingPhase !== "fetching" ? "opacity-50" : "",
                    ].join(" ")}
                  >
                    {loadingPhase === "fetching" ? (
                      <img src="/assets/design/loader.gif" alt="" aria-hidden className="h-[18px] w-[27px] shrink-0 object-contain" />
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden className="shrink-0">
                        <circle cx="9" cy="9" r="8.25" stroke="#1c1412" strokeWidth="1.5" />
                        <path d="M5.5 9L7.5 11L12.5 6.5" stroke="#1c1412" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                    <span className="text-[16px] font-bold text-[#1c1412]">{t.fetchingPhase}</span>
                  </div>

                  {/* Analyzing step row */}
                  <div
                    className={[
                      "flex w-full items-center gap-[8px] rounded-[8px] bg-white p-[12px] transition-opacity duration-200",
                      loadingPhase === "fetching" ? "opacity-50" : "",
                    ].join(" ")}
                  >
                    <img src="/assets/design/loader.gif" alt="" aria-hidden className="h-[18px] w-[27px] shrink-0 object-contain" />
                    <span className="text-[16px] font-bold text-[#1c1412]">{t.analyzingPhase}</span>
                  </div>

                  {/* Timer rows */}
                  {(loadingPhase === "analyzing_objective" || loadingPhase === "analyzing_persona") && progress.total > 0 && (
                    <div
                      className="flex flex-col gap-0 text-center text-[14px] font-semibold text-[#1c1412]"
                      aria-live="polite"
                      aria-atomic="false"
                    >
                      <p className="m-0 font-mono">
                        {t.loadingObjectiveTimeLabel}{" "}
                        {(
                          (progress.phaseDurationsMs.objective_analysis +
                            (progress.currentPersonaPhase === "objective_analysis" ? livePhaseMs : 0)) /
                          1000
                        ).toFixed(1)}s
                      </p>
                      <p className="m-0 font-mono">
                        {t.loadingPersonaTimeLabel}{" "}
                        {(
                          (progress.phaseDurationsMs.persona_simulation +
                            (progress.currentPersonaPhase === "persona_simulation" ? livePhaseMs : 0)) /
                          1000
                        ).toFixed(1)}s
                      </p>
                    </div>
                  )}
                </div>
              </div>
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
                  <div className="flex items-center gap-4">
                    <ExportButton
                      results={results}
                      personas={personas}
                      flowInput={flowInput}
                      productContext={productContext}
                      labels={{
                        export: t.exportBtn,
                        copyMarkdown: t.exportCopyMarkdown,
                        downloadMarkdown: t.exportDownloadMarkdown,
                        copied: t.exportCopied,
                      }}
                      onExport={trackExportResults}
                    />
                    <button
                      type="button"
                      onClick={goToEditFlow}
                      className="inline-flex items-center gap-1.5 text-[14px] font-medium text-[var(--color-primary)] underline underline-offset-4 transition-opacity hover:opacity-80"
                    >
                      <IconPencil aria-hidden className="size-[18px] shrink-0" stroke={1.5} />
                      {t.editFlowBtn}
                    </button>
                  </div>
                ) : null}
              </div>
              {baselineCandidates.length > 0 ? (
                <div className="flex items-center gap-3 text-[13px] text-foreground/70">
                  <span className="font-medium shrink-0">Compare with</span>
                  <label className="relative flex-1 max-w-[380px]">
                    <select
                      value={baselineSimId ?? ""}
                      onChange={(e) => setBaselineSimId(e.target.value || null)}
                      className="w-full h-9 appearance-none rounded-[var(--radius-full)] border border-[var(--color-tertiary-border)] bg-[var(--color-beige-25)] py-0 pr-9 pl-3 text-[13px] font-medium text-foreground outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--color-accent-300)]"
                    >
                      <option value="">— none —</option>
                      {baselineCandidates.slice(0, 10).map((e) => (
                        <option key={e.id} value={e.id}>
                          {new Intl.DateTimeFormat("en", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(e.savedAt))} · {e.flowInput.slice(0, 48)}{e.flowInput.length > 48 ? "…" : ""}
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
              ) : null}
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
                      delta: undefined,
                      deltaPositiveIsGood: true,
                    },
                    { label: t.scoreLabel, value: Math.round(avgScore), variant: scoreToTier(avgScore), kind: "default" as const, delta: metricDeltas?.score, deltaPositiveIsGood: true },
                    { label: t.issuesLabel, value: issueCount, variant: "warning" satisfies StatusVariant, kind: "default" as const, delta: metricDeltas?.issues, deltaPositiveIsGood: false },
                    { label: t.criticalLabel, value: critCount, variant: "error" satisfies StatusVariant, kind: "default" as const, delta: metricDeltas?.crits, deltaPositiveIsGood: false },
                    {
                      label: t.retentionLabel,
                      value: `${retainCount}/${results.length}`,
                      variant: "success" satisfies StatusVariant,
                      kind: "default" as const,
                      delta: metricDeltas?.retain,
                      deltaPositiveIsGood: true,
                    },
                  ] satisfies { label: string; value: string | number; variant: StatusVariant; kind: "default" | "users"; delta: number | undefined; deltaPositiveIsGood: boolean }[]
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
                      delta={m.delta}
                      deltaPositiveIsGood={m.deltaPositiveIsGood}
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
