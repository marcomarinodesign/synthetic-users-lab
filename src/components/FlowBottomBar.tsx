import { useEffect, useMemo, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";

export interface FlowBottomBarProps {
  step: number;
  totalSteps: number;
  selectedCount: number;
  onNext: () => void;
  onBack: () => void;
  primaryLabel: string;
  primaryDisabled?: boolean;
  backLabel?: string;
}

export function FlowBottomBar({
  step,
  totalSteps,
  selectedCount,
  onNext,
  onBack,
  primaryLabel,
  primaryDisabled = false,
  backLabel = "Back",
}: FlowBottomBarProps) {
  const reduceMotion = useReducedMotion();
  const shouldRender = !(step === 0 && selectedCount === 0);

  const targetProgress = useMemo(() => {
    if (totalSteps === 2) {
      return step === 0 ? 40 : 90;
    }
    if (totalSteps > 1) {
      return (step / (totalSteps - 1)) * 100;
    }
    return 100;
  }, [step, totalSteps]);

  const [entered, setEntered] = useState(false);
  const [displayProgress, setDisplayProgress] = useState(0);
  const [shimmer, setShimmer] = useState(false);
  const prevSelRef = useRef(0);

  useEffect(() => {
    setEntered(false);
    const id = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(id);
  }, [step]);

  useEffect(() => {
    if (!shouldRender) {
      prevSelRef.current = 0;
      return;
    }
    if (step === 0 && selectedCount > 0) {
      if (prevSelRef.current === 0) {
        prevSelRef.current = selectedCount;
        if (reduceMotion) {
          setDisplayProgress(targetProgress);
          setShimmer(false);
          return;
        }
        setDisplayProgress(0);
        setShimmer(true);
        let raf2 = 0;
        const raf1 = requestAnimationFrame(() => {
          raf2 = requestAnimationFrame(() => setDisplayProgress(targetProgress));
        });
        const off = window.setTimeout(() => setShimmer(false), 820);
        return () => {
          cancelAnimationFrame(raf1);
          cancelAnimationFrame(raf2);
          clearTimeout(off);
        };
      }
      prevSelRef.current = selectedCount;
      setDisplayProgress(targetProgress);
      return;
    }
    prevSelRef.current = selectedCount;
    setDisplayProgress(targetProgress);
  }, [shouldRender, step, selectedCount, targetProgress, reduceMotion]);

  if (!shouldRender) {
    return null;
  }

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 w-full transition-all duration-300 ease-out ${
        entered ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
      }`}
    >
      <style>{`
        @keyframes flowBarShimmer {
          0% { transform: translateX(-100%); opacity: 0.35; }
          45% { opacity: 0.85; }
          100% { transform: translateX(280%); opacity: 0.2; }
        }
      `}</style>
      <div
        className="relative w-full overflow-hidden border-t border-[color-mix(in_srgb,var(--color-basics-white)_50%,transparent)] bg-[color-mix(in_srgb,var(--color-basics-white)_72%,transparent)] shadow-[0_-8px_32px_color-mix(in_srgb,var(--color-primary)_6%,transparent)] backdrop-blur-md backdrop-saturate-150"
        style={{
          WebkitBackdropFilter: "blur(12px) saturate(1.5)",
        }}
      >
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,color-mix(in_srgb,var(--color-basics-white)_70%,transparent),transparent)]"
          aria-hidden
        />

        <div
          className="relative mx-auto grid h-20 min-h-[5rem] w-full max-w-[1200px] grid-cols-[1fr_auto_1fr] items-center gap-3 px-6 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 md:gap-4 md:px-8"
          role="navigation"
          aria-label="Flow navigation"
        >
          <div className="flex min-w-0 justify-self-start">
            {step > 0 ? (
              <button
                type="button"
                onClick={onBack}
                className="inline-flex items-center gap-0.5 text-sm font-medium text-[var(--color-primary)] transition-opacity hover:opacity-80"
              >
                <IconChevronLeft
                  aria-hidden
                  className="size-[18px] shrink-0"
                  stroke={1.75}
                />
                {backLabel}
              </button>
            ) : null}
          </div>

          <div className="pointer-events-none justify-self-center">
            <div className="relative h-1.5 w-24 overflow-hidden rounded-full bg-[var(--color-grey-soft-middle)] md:w-28">
              <div
                className="relative z-0 h-full rounded-full bg-[var(--color-info-1)] ease-out"
                style={{
                  width: `${displayProgress}%`,
                  transitionProperty: "width",
                  transitionDuration: reduceMotion ? "0ms" : "780ms",
                  transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
                }}
              />
              {shimmer ? (
                <div
                  className="pointer-events-none absolute inset-0 z-[1] overflow-hidden rounded-full"
                  aria-hidden
                >
                  <div
                    className="absolute inset-y-0 w-[42%] rounded-full bg-gradient-to-r from-transparent via-[color-mix(in_srgb,var(--color-basics-white)_80%,transparent)] to-transparent"
                    style={{
                      animation: "flowBarShimmer 0.78s ease-out forwards",
                    }}
                  />
                </div>
              ) : null}
            </div>
          </div>

          <div className="flex min-w-0 justify-self-end">
            <button
              type="button"
              onClick={onNext}
              disabled={primaryDisabled}
              className="inline-flex max-w-full items-center gap-2 rounded-full bg-[var(--color-primary)] px-6 py-3 text-sm font-medium text-[var(--color-primary-text)] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <span className="truncate">{primaryLabel}</span>
              <IconChevronRight
                aria-hidden
                className="size-[18px] shrink-0"
                stroke={1.75}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
