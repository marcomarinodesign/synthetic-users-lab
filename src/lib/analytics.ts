/**
 * Plausible Analytics wrapper.
 *
 * - No-op when `window.plausible` is not available (dev, missing script, ad-blocked).
 * - All event calls are fire-and-forget; errors are silently swallowed so they
 *   never break the app.
 * - Add the Plausible <script> to index.html pointing to VITE_PLAUSIBLE_DOMAIN;
 *   if the env var is empty the script is never injected and every call here is a no-op.
 */

declare global {
  interface Window {
    plausible?: (
      eventName: string,
      options?: { props?: Record<string, string | number | boolean> }
    ) => void;
  }
}

/** Fire a Plausible custom event. No-op when analytics is unavailable. */
export function trackEvent(
  name: string,
  props?: Record<string, string | number | boolean>
): void {
  try {
    window.plausible?.(name, props ? { props } : undefined);
  } catch {
    // never let analytics crash the app
  }
}

// ── Typed event helpers ────────────────────────────────────────────────────

export function trackSimulationStarted(props: {
  personas_count: number;
  source_type: string;
}): void {
  trackEvent("simulation_started", props);
}

export function trackSimulationCompleted(props: {
  personas_count: number;
  avg_score: number;
  issues_count: number;
  critical_count: number;
}): void {
  trackEvent("simulation_completed", props);
}

export function trackExportResults(): void {
  trackEvent("export_results");
}
