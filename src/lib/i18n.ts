import type { IssueFilterLabels, ResultCardLabels } from "@/types/ds";

export type Lang = "es" | "en" | "fr" | "pt" | "de";

export interface PersonaMetaCopy {
  tech: { low: string; medium: string; high: string };
  frustration: { low: string; medium: string; high: string };
  /** Etiqueta antes del nivel (ej. "Frustración") */
  frustrationLabel: string;
  /** Subtítulo bajo el nombre en cards de perfiles expertos (pro). */
  proSubtitle: string;
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
  steps: [string, string, string, string];
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
  contextPlaceholder: string;
  languageLabel: string;
  launchBtn: string;
  fetchingPhase: string;
  analyzingPhase: string;
  userOf: (c: number, t: number) => string;
  scoreLabel: string;
  issuesLabel: string;
  criticalLabel: string;
  retentionLabel: string;
  resultsByUser: string;
  newTestBtn: string;
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
  /** Paso 0: ningún perfil seleccionado */
  selectAtLeastOne: string;
  /** Paso 0: resumen "N usuarios + M pro …" */
  formatSelectionCounter: (simpleCount: number, proCount: number, totalSelected: number) => string;
  personaTabs: PersonaTabsCopy;
  issueFilterLabels: IssueFilterLabels;
  validationNameRequired: string;
  validationDescriptionRequired: string;
  validationFlowRequired: string;
  /** Ayuda bajo el campo de enlace (paso flujo). */
  flowInputHint: string;
  /** Ayuda bajo rasgos en modal de persona custom. */
  traitsFieldHint: string;
}

export const LANG_OPTIONS: { code: Lang; label: string }[] = [
  { code: "es", label: "🇪🇸 ES" },
  { code: "en", label: "🇬🇧 EN" },
  { code: "fr", label: "🇫🇷 FR" },
  { code: "pt", label: "🇧🇷 PT" },
  { code: "de", label: "🇩🇪 DE" },
];

export function detectLang(): Lang {
  const code = (typeof navigator !== "undefined" ? navigator.language : "es").split("-")[0].toLowerCase();
  return (["es", "en", "fr", "pt", "de"] as Lang[]).includes(code as Lang) ? (code as Lang) : "es";
}

/** Subconjunto tipado de copy para `ResultCard` (desacoplado de `Translations`). */
export function pickResultCardLabels(t: Translations): ResultCardLabels {
  return {
    issuesLabel: t.issuesLabel,
    wouldReturnShort: t.wouldReturnShort,
    wouldNotReturnShort: t.wouldNotReturnShort,
    summaryLabel: t.summaryLabel,
    stepsLabel: t.stepsLabel,
    stepCounter: t.stepCounter,
    stepPrevAria: t.stepPrevAria,
    stepNextAria: t.stepNextAria,
    stepGoToAria: t.stepGoToAria,
    issuesSectionLabel: t.issuesSectionLabel,
    sevLabels: t.sevLabels,
    issueCategoryLabels: {
      ux: t.issueFilterLabels.ux,
      ui: t.issueFilterLabels.ui,
      product: t.issueFilterLabels.product,
      copy: t.issueFilterLabels.copy,
    },
    issuesEmptyFilter: t.issuesEmptyFilter,
    wouldReturn: t.wouldReturn,
    wouldNotReturn: t.wouldNotReturn,
  };
}

export const TRANSLATIONS: Record<Lang, Translations> = {
  es: {
    subtitle: "Simula usuarios reales testeando tus flujos.",
    steps: ["Personas", "Flujo", "Test", "Resultados"],
    profilesSelected: (n) => `${n} perfil${n !== 1 ? "es" : ""} seleccionado${n !== 1 ? "s" : ""}`,
    newBtn: "Nuevo",
    nextBtn: "Siguiente",
    backBtn: "Atrás",
    cancelBtn: "Cancelar",
    createBtn: "Crear usuario",
    linkLabel: "Link (web o repo)",
    linkPlaceholder: "https://tu-web.com o https://github.com/user/repo",
    contextLabel: "Contexto del producto",
    contextOptional: "(opcional)",
    contextPlaceholder: "Qué es, para quién, qué problema resuelve...",
    languageLabel: "Idioma",
    launchBtn: "Lanzar simulación",
    fetchingPhase: "Leyendo contenido de las URLs...",
    analyzingPhase: "Analizando con Gemini...",
    userOf: (c, t) => `Usuario ${c} de ${t}`,
    scoreLabel: "Score medio",
    issuesLabel: "Issues",
    criticalLabel: "Críticos",
    retentionLabel: "Retención",
    resultsByUser: "Resultados por usuario",
    newTestBtn: "Nuevo test",
    editFlowBtn: "Editar flujo",
    modalTitle: "Nuevo usuario sintético",
    modalDesc: "Define el perfil para tus tests.",
    nameLabel: "Nombre",
    namePlaceholder: "Ej: Carlos — Dueño de HomeService",
    descLabel: "Descripción",
    descPlaceholder: "Describe quién es, cómo usa tecnología, qué espera...",
    traitsLabel: "Rasgos",
    traitsSuffix: "(separados por coma)",
    traitsPlaceholder: "Impaciente, Bajo nivel digital, Espera ROI...",
    wouldReturn: "Volvería a usar el producto",
    wouldNotReturn: "No volvería a usar el producto",
    wouldReturnShort: "Volvería",
    wouldNotReturnShort: "No volvería",
    summaryLabel: "Resumen",
    stepsLabel: "Recorrido",
    issuesSectionLabel: "Issues",
    sevLabels: { critical: "Crítico", warning: "Aviso", info: "Info" },
    personaMeta: {
      tech: { low: "No técnico", medium: "Intermedio", high: "Técnico" },
      frustration: { low: "baja", medium: "media", high: "alta" },
      frustrationLabel: "Frustración",
      proSubtitle: "Experto que dan feedback accionable",
    },
    stepPrevAria: "Paso anterior",
    stepNextAria: "Paso siguiente",
    stepGoToAria: (step) => `Ir al paso ${step}`,
    stepCounter: (current, total) => `Paso ${current} de ${total}`,
    issuesEmptyFilter: "No hay issues en esta categoría.",
    selectAtLeastOne: "Selecciona al menos un perfil",
    formatSelectionCounter: (simpleCount, proCount, totalSelected) => {
      const parts: string[] = [];
      if (simpleCount > 0) parts.push(`${simpleCount} usuario${simpleCount !== 1 ? "s" : ""}`);
      if (proCount > 0) parts.push(`${proCount} pro`);
      return parts.join(" + ") + " seleccionado" + (totalSelected !== 1 ? "s" : "");
    },
    personaTabs: {
      simpleTitle: "👤 Usuarios",
      simpleDesc: "Simulan personas reales usando tu producto",
      proTitle: "🔬 Pro",
      proDesc: "Expertos UX/UI que dan feedback accionable",
    },
    issueFilterLabels: {
      all: "Todos",
      ux: "UX",
      ui: "UI",
      product: "Producto",
      copy: "Copy",
    },
    validationNameRequired: "Indica un nombre.",
    validationDescriptionRequired: "Indica una descripción.",
    validationFlowRequired: "Indica un enlace o URL para analizar.",
    flowInputHint: "Puedes pegar una URL web o un enlace a repositorio (p. ej. GitHub).",
    traitsFieldHint: "Opcional. Varios rasgos, separados por coma.",
  },
  en: {
    subtitle: "Simulate real users testing your flows.",
    steps: ["Personas", "Flow", "Test", "Results"],
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
    contextPlaceholder: "What it is, who it's for, what problem it solves...",
    languageLabel: "Language",
    launchBtn: "Launch simulation",
    fetchingPhase: "Reading URL content...",
    analyzingPhase: "Analyzing with Gemini...",
    userOf: (c, t) => `User ${c} of ${t}`,
    scoreLabel: "Avg score",
    issuesLabel: "Issues",
    criticalLabel: "Critical",
    retentionLabel: "Retention",
    resultsByUser: "Results by user",
    newTestBtn: "New test",
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
    summaryLabel: "Summary",
    stepsLabel: "Journey",
    issuesSectionLabel: "Issues",
    sevLabels: { critical: "Critical", warning: "Warning", info: "Info" },
    personaMeta: {
      tech: { low: "Non-technical", medium: "Intermediate", high: "Technical" },
      frustration: { low: "low", medium: "medium", high: "high" },
      frustrationLabel: "Frustration",
      proSubtitle: "Experts who give actionable feedback",
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
    traitsFieldHint: "Optional. Multiple traits, comma-separated.",
  },
  fr: {
    subtitle: "Simulez de vrais utilisateurs testant vos flux.",
    steps: ["Personas", "Flux", "Test", "Résultats"],
    profilesSelected: (n) => `${n} profil${n !== 1 ? "s" : ""} sélectionné${n !== 1 ? "s" : ""}`,
    newBtn: "Nouveau",
    nextBtn: "Suivant",
    backBtn: "Retour",
    cancelBtn: "Annuler",
    createBtn: "Créer l'utilisateur",
    linkLabel: "Lien (web ou repo)",
    linkPlaceholder: "https://votre-site.com ou https://github.com/user/repo",
    contextLabel: "Contexte produit",
    contextOptional: "(optionnel)",
    contextPlaceholder: "Ce que c'est, pour qui, quel problème ça résout...",
    languageLabel: "Langue",
    launchBtn: "Lancer la simulation",
    fetchingPhase: "Lecture du contenu des URLs...",
    analyzingPhase: "Analyse avec Gemini...",
    userOf: (c, t) => `Utilisateur ${c} sur ${t}`,
    scoreLabel: "Score moyen",
    issuesLabel: "Problèmes",
    criticalLabel: "Critiques",
    retentionLabel: "Rétention",
    resultsByUser: "Résultats par utilisateur",
    newTestBtn: "Nouveau test",
    editFlowBtn: "Modifier le flux",
    modalTitle: "Nouvel utilisateur synthétique",
    modalDesc: "Définissez le profil pour vos tests.",
    nameLabel: "Nom",
    namePlaceholder: "Ex: Carlos — Propriétaire de HomeService",
    descLabel: "Description",
    descPlaceholder: "Décrivez qui il est, comment il utilise la tech, ce qu'il attend...",
    traitsLabel: "Traits",
    traitsSuffix: "(séparés par virgule)",
    traitsPlaceholder: "Impatient, Faible niveau numérique, Attend un ROI...",
    wouldReturn: "Reviendrait utiliser le produit",
    wouldNotReturn: "Ne reviendrait pas utiliser le produit",
    wouldReturnShort: "Reviendrait",
    wouldNotReturnShort: "Ne reviendrait pas",
    summaryLabel: "Résumé",
    stepsLabel: "Parcours",
    issuesSectionLabel: "Problèmes",
    sevLabels: { critical: "Critique", warning: "Avertissement", info: "Info" },
    personaMeta: {
      tech: { low: "Peu technique", medium: "Intermédiaire", high: "Technique" },
      frustration: { low: "faible", medium: "moyenne", high: "élevée" },
      frustrationLabel: "Frustration",
      proSubtitle: "Experts qui donnent un feedback actionnable",
    },
    stepPrevAria: "Étape précédente",
    stepNextAria: "Étape suivante",
    stepGoToAria: (step) => `Aller à l'étape ${step}`,
    stepCounter: (current, total) => `Étape ${current} sur ${total}`,
    issuesEmptyFilter: "Aucun problème dans cette catégorie.",
    selectAtLeastOne: "Sélectionnez au moins un profil",
    formatSelectionCounter: (simpleCount, proCount, totalSelected) => {
      const parts: string[] = [];
      if (simpleCount > 0) parts.push(`${simpleCount} utilisateur${simpleCount !== 1 ? "s" : ""}`);
      if (proCount > 0) parts.push(`${proCount} pro`);
      return parts.join(" + ") + ` sélectionné${totalSelected !== 1 ? "s" : ""}`;
    },
    personaTabs: {
      simpleTitle: "👤 Utilisateurs",
      simpleDesc: "Simulent de vraies personnes utilisant votre produit",
      proTitle: "🔬 Pro",
      proDesc: "Experts UX/UI avec un feedback actionnable",
    },
    issueFilterLabels: {
      all: "Tous",
      ux: "UX",
      ui: "UI",
      product: "Produit",
      copy: "Texte",
    },
    validationNameRequired: "Indiquez un nom.",
    validationDescriptionRequired: "Indiquez une description.",
    validationFlowRequired: "Indiquez un lien ou une URL à analyser.",
    flowInputHint: "Collez une URL web ou un lien de dépôt (ex. GitHub).",
    traitsFieldHint: "Optionnel. Plusieurs traits, séparés par des virgules.",
  },
  pt: {
    subtitle: "Simule usuários reais testando seus fluxos.",
    steps: ["Personas", "Fluxo", "Teste", "Resultados"],
    profilesSelected: (n) => `${n} perfil${n !== 1 ? "is" : ""} selecionado${n !== 1 ? "s" : ""}`,
    newBtn: "Novo",
    nextBtn: "Próximo",
    backBtn: "Voltar",
    cancelBtn: "Cancelar",
    createBtn: "Criar usuário",
    linkLabel: "Link (web ou repo)",
    linkPlaceholder: "https://seu-site.com ou https://github.com/user/repo",
    contextLabel: "Contexto do produto",
    contextOptional: "(opcional)",
    contextPlaceholder: "O que é, para quem, qual problema resolve...",
    languageLabel: "Idioma",
    launchBtn: "Lançar simulação",
    fetchingPhase: "Lendo conteúdo das URLs...",
    analyzingPhase: "Analisando com Gemini...",
    userOf: (c, t) => `Usuário ${c} de ${t}`,
    scoreLabel: "Score médio",
    issuesLabel: "Issues",
    criticalLabel: "Críticos",
    retentionLabel: "Retenção",
    resultsByUser: "Resultados por usuário",
    newTestBtn: "Novo teste",
    editFlowBtn: "Editar fluxo",
    modalTitle: "Novo usuário sintético",
    modalDesc: "Defina o perfil para seus testes.",
    nameLabel: "Nome",
    namePlaceholder: "Ex: Carlos — Dono do HomeService",
    descLabel: "Descrição",
    descPlaceholder: "Descreva quem é, como usa tecnologia, o que espera...",
    traitsLabel: "Características",
    traitsSuffix: "(separadas por vírgula)",
    traitsPlaceholder: "Impaciente, Baixo nível digital, Espera ROI...",
    wouldReturn: "Voltaria a usar o produto",
    wouldNotReturn: "Não voltaria a usar o produto",
    wouldReturnShort: "Voltaria",
    wouldNotReturnShort: "Não voltaria",
    summaryLabel: "Resumo",
    stepsLabel: "Percurso",
    issuesSectionLabel: "Issues",
    sevLabels: { critical: "Crítico", warning: "Aviso", info: "Info" },
    personaMeta: {
      tech: { low: "Não técnico", medium: "Intermediário", high: "Técnico" },
      frustration: { low: "baixa", medium: "média", high: "alta" },
      frustrationLabel: "Frustração",
      proSubtitle: "Especialistas que dão feedback acionável",
    },
    stepPrevAria: "Passo anterior",
    stepNextAria: "Próximo passo",
    stepGoToAria: (step) => `Ir para o passo ${step}`,
    stepCounter: (current, total) => `Passo ${current} de ${total}`,
    issuesEmptyFilter: "Não há issues nesta categoria.",
    selectAtLeastOne: "Selecione pelo menos um perfil",
    formatSelectionCounter: (simpleCount, proCount, totalSelected) => {
      const parts: string[] = [];
      if (simpleCount > 0) parts.push(`${simpleCount} usuário${simpleCount !== 1 ? "s" : ""}`);
      if (proCount > 0) parts.push(`${proCount} pro`);
      return parts.join(" + ") + ` selecionado${totalSelected !== 1 ? "s" : ""}`;
    },
    personaTabs: {
      simpleTitle: "👤 Usuários",
      simpleDesc: "Simulam pessoas reais usando seu produto",
      proTitle: "🔬 Pro",
      proDesc: "Especialistas UX/UI com feedback acionável",
    },
    issueFilterLabels: {
      all: "Todos",
      ux: "UX",
      ui: "UI",
      product: "Produto",
      copy: "Copy",
    },
    validationNameRequired: "Informe um nome.",
    validationDescriptionRequired: "Informe uma descrição.",
    validationFlowRequired: "Informe um link ou URL para analisar.",
    flowInputHint: "Cole uma URL ou link de repositório (ex.: GitHub).",
    traitsFieldHint: "Opcional. Várias características, separadas por vírgula.",
  },
  de: {
    subtitle: "Simulieren Sie echte Nutzer beim Testen Ihrer Flows.",
    steps: ["Personas", "Flow", "Test", "Ergebnisse"],
    profilesSelected: (n) => `${n} Profil${n !== 1 ? "e" : ""} ausgewählt`,
    newBtn: "Neu",
    nextBtn: "Weiter",
    backBtn: "Zurück",
    cancelBtn: "Abbrechen",
    createBtn: "Nutzer erstellen",
    linkLabel: "Link (Web oder Repo)",
    linkPlaceholder: "https://ihre-seite.com oder https://github.com/user/repo",
    contextLabel: "Produktkontext",
    contextOptional: "(optional)",
    contextPlaceholder: "Was es ist, für wen, welches Problem es löst...",
    languageLabel: "Sprache",
    launchBtn: "Simulation starten",
    fetchingPhase: "URL-Inhalt wird gelesen...",
    analyzingPhase: "Analyse mit Gemini...",
    userOf: (c, t) => `Nutzer ${c} von ${t}`,
    scoreLabel: "Ø Score",
    issuesLabel: "Probleme",
    criticalLabel: "Kritisch",
    retentionLabel: "Bindung",
    resultsByUser: "Ergebnisse nach Nutzer",
    newTestBtn: "Neuer Test",
    editFlowBtn: "Flow bearbeiten",
    modalTitle: "Neuer synthetischer Nutzer",
    modalDesc: "Definieren Sie das Profil für Ihre Tests.",
    nameLabel: "Name",
    namePlaceholder: "z.B.: Carlos — HomeService-Inhaber",
    descLabel: "Beschreibung",
    descPlaceholder: "Beschreiben Sie, wer er ist, wie er Tech nutzt, was er erwartet...",
    traitsLabel: "Eigenschaften",
    traitsSuffix: "(kommagetrennt)",
    traitsPlaceholder: "Ungeduldig, Geringes digitales Niveau, Erwartet ROI...",
    wouldReturn: "Würde das Produkt wieder nutzen",
    wouldNotReturn: "Würde das Produkt nicht wieder nutzen",
    wouldReturnShort: "Würde zurückkommen",
    wouldNotReturnShort: "Würde nicht zurückkommen",
    summaryLabel: "Zusammenfassung",
    stepsLabel: "Verlauf",
    issuesSectionLabel: "Probleme",
    sevLabels: { critical: "Kritisch", warning: "Warnung", info: "Info" },
    personaMeta: {
      tech: { low: "Nicht technisch", medium: "Mittel", high: "Technisch" },
      frustration: { low: "niedrig", medium: "mittel", high: "hoch" },
      frustrationLabel: "Frustration",
      proSubtitle: "Expert:innen mit umsetzbarem Feedback",
    },
    stepPrevAria: "Vorheriger Schritt",
    stepNextAria: "Nächster Schritt",
    stepGoToAria: (step) => `Zu Schritt ${step}`,
    stepCounter: (current, total) => `Schritt ${current} von ${total}`,
    issuesEmptyFilter: "Keine Probleme in dieser Kategorie.",
    selectAtLeastOne: "Wählen Sie mindestens ein Profil",
    formatSelectionCounter: (simpleCount, proCount) => {
      const parts: string[] = [];
      if (simpleCount > 0) parts.push(`${simpleCount} Nutzer`);
      if (proCount > 0) parts.push(`${proCount} Pro`);
      return `${parts.join(" + ")} ausgewählt`;
    },
    personaTabs: {
      simpleTitle: "👤 Nutzer",
      simpleDesc: "Simulieren echte Menschen bei der Nutzung Ihres Produkts",
      proTitle: "🔬 Pro",
      proDesc: "UX/UI-Experten mit umsetzbarem Feedback",
    },
    issueFilterLabels: {
      all: "Alle",
      ux: "UX",
      ui: "UI",
      product: "Produkt",
      copy: "Text",
    },
    validationNameRequired: "Bitte einen Namen eingeben.",
    validationDescriptionRequired: "Bitte eine Beschreibung eingeben.",
    validationFlowRequired: "Bitte einen Link oder eine URL zum Analysieren eingeben.",
    flowInputHint: "Web-URL oder Repository-Link einfügen (z. B. GitHub).",
    traitsFieldHint: "Optional. Mehrere Merkmale, kommagetrennt.",
  },
};
