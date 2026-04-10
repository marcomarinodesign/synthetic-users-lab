/**
 * Bloque superior de resultados (Figma 1:711): retención + cita (verbatim o resumen).
 * Tipografía: Instrument Serif 36px italic (título), Public Sans 16px/500 (cuerpo).
 */
export interface ResultFeedbackHeroProps {
  title: string;
  /** Texto entre comillas (verbatim o resumen). */
  quoteText: string;
}

export function ResultFeedbackHero({ title, quoteText }: ResultFeedbackHeroProps) {
  return (
    <div className="flex w-full flex-col items-center justify-center gap-4 self-stretch rounded-[20px] bg-[var(--color-basics-white)] p-[var(--space-5)] text-[var(--color-primary)] sm:p-[var(--space-8)] md:p-[var(--space-12)]">
      <p className="w-full self-stretch font-serif text-[26px] font-normal italic leading-normal sm:text-[32px] md:text-[36px]">{title}</p>
      <p className="w-full self-stretch font-sans text-[16px] font-medium leading-[22px]">
        &quot;{quoteText}&quot;
      </p>
    </div>
  );
}
