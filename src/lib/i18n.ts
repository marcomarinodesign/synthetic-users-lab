import type { IssueFilterLabels, ResultCardLabels } from "@/types/ds";

export interface PersonaMetaCopy {
  tech: { low: string; medium: string; high: string };
  frustration: { low: string; medium: string; high: string };
  frustrationLabel: string;
  proSubtitle: string;
  proBadgeLabel: string;
}

export interface PersonaTabsCopy {
  simpleTitle: string;
  simpleDesc: string;
  proTitle: string;
  proDesc: string;
}

export type { IssueFilterLabels } from "@/types/ds";

export interface Translations {
  subtitle: string;
  profilesSelected: (n: number) => string;
  newBtn: string;
  nextBtn: string;
  backBtn: string;
  cancelBtn: string;
  createBtn: string;
  linkLabel: string;
  linkPlaceholder: string;
  contextLabel: string;
  contextOptional: string;
  contextHint: string;
  contextPlaceholder: string;
  launchBtn: string;
  fetchingPhase: string;
  analyzingPhase: string;
  loadingSelectedHeading: string;
  /** Loading step 2: phase label under progress (objective vs persona). */
  loadingPhaseObjective: string;
  loadingPhasePersona: string;
  /** Loading step 2: timer line for objective analysis. */
  loadingObjectiveTimeLabel: string;
  /** Loading step 2: timer line for persona simulation. */
  loadingPersonaTimeLabel: string;
  userOf: (c: number, t: number) => string;
  scoreLabel: string;
  issuesLabel: string;
  criticalLabel: string;
  retentionLabel: string;
  usersLabel: string;
  resultsByUser: string;
  filterLabel: string;
  editFlowBtn: string;
  modalTitle: string;
  modalDesc: string;
  nameLabel: string;
  namePlaceholder: string;
  descLabel: string;
  descPlaceholder: string;
  traitsLabel: string;
  traitsSuffix: string;
  traitsPlaceholder: string;
  wouldReturn: string;
  wouldNotReturn: string;
  wouldReturnShort: string;
  wouldNotReturnShort: string;
  feedbackHeroRetentionUnknown: string;
  summaryLabel: string;
  stepsLabel: string;
  issuesSectionLabel: string;
  sevLabels: { critical: string; warning: string; info: string };
  personaMeta: PersonaMetaCopy;
  stepPrevAria: string;
  stepNextAria: string;
  stepGoToAria: (step: number) => string;
  stepCounter: (current: number, total: number) => string;
  issuesEmptyFilter: string;
  selectAtLeastOne: string;
  formatSelectionCounter: (simpleCount: number, proCount: number, totalSelected?: number) => string;
  personaTabs: PersonaTabsCopy;
  issueFilterLabels: IssueFilterLabels;
  validationNameRequired: string;
  validationDescriptionRequired: string;
  validationFlowRequired: string;
  flowInputHint: string;
  flowStepTitle: string;
  flowSelectedHeading: string;
  traitsFieldHint: string;
  appTitle: string;
  unknownPersonaName: string;
  scoreUxLabel: string;
  scoreFitLabel: string;
  errorPrefix: string;
  simulationErrorAction: string;
  simulationErrorComponent: string;
  navbarLogoShort: string;
  navbarLogoAria: string;
  navbarBeta: string;
  navbarFeedback: string;
  navbarAboutAria: string;
  aboutModalTitle: string;
  aboutModalBody: string;
  feedbackModalTitle: string;
  feedbackModalDesc: string;
  feedbackFieldMessage: string;
  feedbackPlaceholderMessage: string;
  feedbackFieldEmail: string;
  feedbackPlaceholderEmail: string;
  feedbackSubmit: string;
  feedbackEmailSubject: string;
  wipBannerText: string;
  wipBannerCloseAria: string;
  analysisModeTitle: string;
  analysisModeFastLabel: string;
  analysisModeFastDesc: string;
  analysisModeMaxLabel: string;
  analysisModeMaxDesc: string;
}

/** Single-language app (English). */
export const t: Translations = {
  subtitle: "Simulate real users testing your flows.",
  profilesSelected: (n) => `${n} profile${n !== 1 ? "s" : ""} selected`,
  newBtn: "New",
  nextBtn: "Next",
  backBtn: "Back",
  cancelBtn: "Cancel",
  createBtn: "Create user",
  linkLabel: "Link (web or repo)",
  linkPlaceholder: "https://your-site.com or https://github.com/user/repo",
  contextLabel: "Product context",
  contextOptional: "(optional)",
  contextHint: "Add context about what you need (Optional)",
  contextPlaceholder: "Describe the website",
  launchBtn: "Launch simulation",
  fetchingPhase: "Reading URL content...",
  analyzingPhase: "Analyzing with Gemini...",
  loadingSelectedHeading: "Selected profiles",
  loadingPhaseObjective: "Phase: objective analysis",
  loadingPhasePersona: "Phase: persona simulation",
  loadingObjectiveTimeLabel: "Objective analysis time:",
  loadingPersonaTimeLabel: "Persona simulation time:",
  userOf: (c, tot) => `User ${c} of ${tot}`,
  scoreLabel: "Avg score",
  issuesLabel: "Issues",
  criticalLabel: "Critical",
  retentionLabel: "Retention",
  usersLabel: "Users",
  resultsByUser: "Analysis results",
  filterLabel: "Filter",
  editFlowBtn: "Edit flow",
  modalTitle: "New synthetic user",
  modalDesc: "Define the profile for your tests.",
  nameLabel: "Name",
  namePlaceholder: "E.g: Carlos — HomeService owner",
  descLabel: "Description",
  descPlaceholder: "Describe who they are, how they use tech, what they expect...",
  traitsLabel: "Traits",
  traitsSuffix: "(comma-separated)",
  traitsPlaceholder: "Impatient, Low digital literacy, Expects ROI...",
  wouldReturn: "Would use the product again",
  wouldNotReturn: "Would not use the product again",
  wouldReturnShort: "Would return",
  wouldNotReturnShort: "Would not return",
  feedbackHeroRetentionUnknown: "Retention undetermined",
  summaryLabel: "Summary",
  stepsLabel: "Journey",
  issuesSectionLabel: "Issues",
  sevLabels: { critical: "Critical", warning: "Warning", info: "Info" },
  personaMeta: {
    tech: { low: "Non-technical", medium: "Intermediate", high: "Technical" },
    frustration: { low: "low", medium: "medium", high: "high" },
    frustrationLabel: "Frustration",
    proSubtitle: "Experts who give actionable feedback",
    proBadgeLabel: "PRO",
  },
  stepPrevAria: "Previous step",
  stepNextAria: "Next step",
  stepGoToAria: (step) => `Go to step ${step}`,
  stepCounter: (current, total) => `Step ${current} of ${total}`,
  issuesEmptyFilter: "No issues in this category.",
  selectAtLeastOne: "Select at least one profile",
  formatSelectionCounter: (simpleCount, proCount) => {
    const parts: string[] = [];
    if (simpleCount > 0) parts.push(`${simpleCount} user${simpleCount !== 1 ? "s" : ""}`);
    if (proCount > 0) parts.push(`${proCount} pro`);
    return parts.join(" + ") + " selected";
  },
  personaTabs: {
    simpleTitle: "👤 Users",
    simpleDesc: "Simulate real people using your product",
    proTitle: "🔬 Pro",
    proDesc: "UX/UI experts giving actionable feedback",
  },
  issueFilterLabels: {
    all: "All",
    ux: "UX",
    ui: "UI",
    product: "Product",
    copy: "Copy",
  },
  validationNameRequired: "Enter a name.",
  validationDescriptionRequired: "Enter a description.",
  validationFlowRequired: "Enter a link or URL to analyze.",
  flowInputHint: "Paste a web URL or a repository link (e.g. GitHub).",
  flowStepTitle: "Add the data to simulate your flows",
  flowSelectedHeading: "Selected users",
  traitsFieldHint: "Optional. Multiple traits, comma-separated.",
  appTitle: "Synthetic Users Lab",
  unknownPersonaName: "User",
  scoreUxLabel: "UX",
  scoreFitLabel: "Fit",
  errorPrefix: "Error",
  simulationErrorAction: "Retry the simulation and ensure the backend returns valid JSON.",
  simulationErrorComponent: "Simulation API",
  navbarLogoShort: "SUL",
  navbarLogoAria: "Go to home and start over",
  navbarBeta: "Beta",
  navbarFeedback: "Leave feedback",
  navbarAboutAria: "About Synthetic Users Lab",
  aboutModalTitle: "About Synthetic Users Lab",
  aboutModalBody:
    "Synthetic Users Lab (SUL) lets you simulate how different user profiles interact with a product flow. You provide a URL, repo link, or description, pick personas, and the AI returns feedback: score, issues, a step-by-step journey, and retention likelihood.\n\nSimulations use Gemini to ground insights in an objective analysis of the flow, helping keep results more consistent across runs.",
  feedbackModalTitle: "Your feedback",
  feedbackModalDesc: "Tell us what we should improve or what you would like to see in SUL.",
  feedbackFieldMessage: "Message",
  feedbackPlaceholderMessage: "Write your comments here…",
  feedbackFieldEmail: "Email (optional)",
  feedbackPlaceholderEmail: "you@email.com",
  feedbackSubmit: "Send",
  feedbackEmailSubject: "Synthetic Users Lab feedback",
  wipBannerText: "Synthetic Users Lab is in beta.",
  wipBannerCloseAria: "Dismiss",
  analysisModeTitle: "Analysis mode",
  analysisModeFastLabel: "Fast",
  analysisModeFastDesc:
    "Lower output cap: usually quicker per user. Journey and issues may be shorter.",
  analysisModeMaxLabel: "Maximum",
  analysisModeMaxDesc:
    "Higher output cap: usually slower, with more detail in steps and issues.",
};

export function pickResultCardLabels(translations: Translations): ResultCardLabels {
  return {
    issuesLabel: translations.issuesLabel,
    wouldReturnShort: translations.wouldReturnShort,
    wouldNotReturnShort: translations.wouldNotReturnShort,
    summaryLabel: translations.summaryLabel,
    stepsLabel: translations.stepsLabel,
    stepCounter: translations.stepCounter,
    stepPrevAria: translations.stepPrevAria,
    stepNextAria: translations.stepNextAria,
    stepGoToAria: translations.stepGoToAria,
    issuesSectionLabel: translations.issuesSectionLabel,
    sevLabels: translations.sevLabels,
    issueCategoryLabels: {
      ux: translations.issueFilterLabels.ux,
      ui: translations.issueFilterLabels.ui,
      product: translations.issueFilterLabels.product,
      copy: translations.issueFilterLabels.copy,
    },
    issuesEmptyFilter: translations.issuesEmptyFilter,
    wouldReturn: translations.wouldReturn,
    wouldNotReturn: translations.wouldNotReturn,
    feedbackHeroRetentionUnknown: translations.feedbackHeroRetentionUnknown,
    uxScoreLabel: translations.scoreUxLabel,
    fitScoreLabel: translations.scoreFitLabel,
    unknownPersonaName: translations.unknownPersonaName,
    filterLabel: translations.filterLabel,
  };
}

export interface SimulationErrorCopy {
  summary: (technicalMessage: string) => string;
  action: string;
  component: string;
}

export function getSimulationErrorCopy(): SimulationErrorCopy {
  return {
    summary: (msg) => `${t.errorPrefix}: ${msg}`,
    action: t.simulationErrorAction,
    component: t.simulationErrorComponent,
  };
}
