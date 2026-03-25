import { useState, useEffect } from "react";

const TICK_MS = 250;

/**
 * Tiempo transcurrido en ms desde `startAt`, actualizado varias veces por segundo.
 * Si `startAt` es null, devuelve 0.
 */
export function useLiveElapsedMs(startAt: number | null): number {
  const [, setTick] = useState(0);
  useEffect(() => {
    if (startAt == null) return;
    const id = setInterval(() => setTick((t) => t + 1), TICK_MS);
    return () => clearInterval(id);
  }, [startAt]);
  return startAt == null ? 0 : Math.max(0, Date.now() - startAt);
}
