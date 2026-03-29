/** Filtros de issues en resultados (paso 3). */
export interface IssueFilterLabels {
  all: string;
  ux: string;
  ui: string;
  product: string;
  copy: string;
}

/** Copy mínimo para `ResultCard` sin acoplar a `Translations` completo. */
export interface ResultCardLabels {
  issuesLabel: string;
  wouldReturnShort: string;
  wouldNotReturnShort: string;
  summaryLabel: string;
  stepsLabel: string;
  stepCounter: (current: number, total: number) => string;
  stepPrevAria: string;
  stepNextAria: string;
  stepGoToAria: (step: number) => string;
  issuesSectionLabel: string;
  sevLabels: { critical: string; warning: string; info: string };
  issueCategoryLabels: Pick<IssueFilterLabels, "ux" | "ui" | "product" | "copy">;
  issuesEmptyFilter: string;
  wouldReturn: string;
  wouldNotReturn: string;
  /** Título del bloque hero cuando `wouldReturn` es null. */
  feedbackHeroRetentionUnknown: string;
  /** Etiqueta del badge de puntuación UX (p. ej. "UX"). */
  uxScoreLabel: string;
  /** Etiqueta del badge de fit (p. ej. "Fit" / "Ajuste"). */
  fitScoreLabel: string;
  /** Si no hay persona en la lista (snapshot antiguo, etc.). */
  unknownPersonaName: string;
  /** Etiqueta "Filtrar" junto al desplegable de categoría de issues (vista panel). */
  filterLabel: string;
  /** Título de la card izquierda de cada issue (descripción del usuario). */
  issueDescriptionLabel: string;
  /** Título de la card derecha de cada issue (tip de mejora). */
  issueActionLabel: string;
}
