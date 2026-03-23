/**
 * Tokens de estado unificados (métricas, badges de score, severidad de issues).
 * Colores vía `--color-*` en `globals.css` (Pomegranate / Cornflower / mezclas con Asfalt).
 * Dudoso: warning comparte familia cromática con error — revisar jerarquía visual en métricas.
 */

import type { IssueSeverity } from "@/domain/simulation";

export type { IssueSeverity };
/** Variante de estado para scores 1–10 y métricas agregadas. */
export type StatusVariant = "success" | "warning" | "error";

const statusVariantBadgeClass: Record<StatusVariant, string> = {
  success:
    "bg-[var(--color-accent-100)] text-[var(--color-accent-700)] border-[var(--color-accent-300)]",
  warning:
    "bg-[var(--color-warning-2)] text-[var(--color-warning-1)] border-[var(--color-warning-1)]",
  error:
    "bg-[var(--color-error-3)] text-[var(--color-error-1)] border-[var(--color-error-2)]",
};

const issueSeverityBadgeClassMap: Record<IssueSeverity, string> = {
  critical:
    "bg-[var(--color-error-3)] text-[var(--color-error-1)] border-[var(--color-error-2)]",
  warning:
    "bg-[var(--color-warning-2)] text-[var(--color-warning-1)] border-[var(--color-warning-1)]",
  info: "bg-[var(--color-info-2)] text-[var(--color-info-1)] border-[var(--color-info-1)]",
};

/** Tier para scores numéricos 1–10 (UX/Fit, métricas). */
export function scoreToTier(score: number): StatusVariant {
  if (score >= 7) return "success";
  if (score >= 4) return "warning";
  return "error";
}

/** Clases para Badge outline — variantes success | warning | error (métricas, score). */
export function getStatusVariantBadgeClass(variant: StatusVariant): string {
  return statusVariantBadgeClass[variant];
}

/** Alias explícito para lectura en templates (mismo mapa que getStatusVariantBadgeClass). */
export function getSeverityBadgeClass(variant: StatusVariant): string {
  return getStatusVariantBadgeClass(variant);
}

/** Severidad de issue (critical | warning | info). */
export function getIssueSeverityBadgeClass(severity: IssueSeverity): string {
  return issueSeverityBadgeClassMap[severity];
}

/** @deprecated Prefer getStatusVariantBadgeClass — mapa expuesto para spreads puntuales. */
export const scoreTierBadgeClass = statusVariantBadgeClass;

export const issueSeverityBadgeClass = issueSeverityBadgeClassMap;

/** Categoría de issue (UX/UI/Product/Copy) — neutro. */
export const issueCategoryBadgeClass =
  "bg-[var(--color-beige-50)] text-[var(--color-basics-black)] border-[var(--color-tertiary-border)]";

/** Paso numerado en carousel de journey. */
export const stepIndexBadgeClass =
  "bg-[var(--color-accent-100)] text-[var(--color-accent-700)] border-[var(--color-accent-300)]";
