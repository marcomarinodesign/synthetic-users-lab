import { siteFooter } from "@/lib/site";

export interface SiteFooterProps {
  /** Evita que el contenido quede bajo la barra de flujo fija. */
  reserveSpaceForOverlay?: boolean;
}

export function SiteFooter({ reserveSpaceForOverlay = false }: SiteFooterProps) {
  return (
    <footer
      className={[
        "w-full bg-transparent",
        reserveSpaceForOverlay ? "mb-[calc(5rem+env(safe-area-inset-bottom))]" : "",
      ].join(" ")}
    >
      <div className="mx-auto flex w-full max-w-[1200px] flex-col items-start justify-between gap-4 px-[var(--space-5)] py-[var(--space-6)] sm:flex-row sm:items-center md:px-[var(--space-8)]">
        <p className="m-0 text-left text-sm text-[var(--color-basics-text-secondary)]">
          {siteFooter.copyright}
        </p>
        <nav
          className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-[var(--color-basics-text-secondary)]"
          aria-label="Perfiles"
        >
          {siteFooter.profiles.map(({ label, href }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--color-basics-text-secondary)] underline-offset-4 transition-colors hover:text-[var(--color-primary)] hover:underline"
            >
              {label}
            </a>
          ))}
        </nav>
      </div>
    </footer>
  );
}
