import { useState } from "react";
import { IconX } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import type { Translations } from "@/lib/i18n";

const STORAGE_KEY = "sul-wip-banner-dismissed";

function readDismissed(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export interface Banner1Props {
  t: Pick<Translations, "wipBannerText" | "wipBannerCloseAria">;
}

/**
 * Inspirado en `@shadcndesign/banner-1` (shadcn registry): barra superior de aviso.
 * Adaptado a Vite, tokens Plinng y `@tabler/icons-react` (sin Next.js ni lucide).
 */
export function Banner1({ t }: Banner1Props) {
  const [dismissed, setDismissed] = useState(readDismissed);

  const dismiss = () => {
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // ignore private mode / quota
    }
    setDismissed(true);
  };

  if (dismissed) return null;

  return (
    <aside
      role="banner"
      aria-label={t.wipBannerText}
      className="relative z-[60] flex w-full items-center bg-[var(--color-primary)] py-3 pr-12 pl-6 text-[var(--color-primary-text)]"
    >
      <div className="flex w-full items-start justify-start md:items-center md:justify-center">
        <p className="m-0 max-w-none text-left text-sm font-medium leading-snug md:text-center">{t.wipBannerText}</p>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={dismiss}
        className="absolute top-1/2 right-2 h-8 w-8 -translate-y-1/2 rounded-[var(--radius-md)] text-[var(--color-primary-text)] hover:bg-white/15"
        aria-label={t.wipBannerCloseAria}
      >
        <IconX className="size-4" stroke={1.5} aria-hidden />
        <span className="sr-only">{t.wipBannerCloseAria}</span>
      </Button>
    </aside>
  );
}
