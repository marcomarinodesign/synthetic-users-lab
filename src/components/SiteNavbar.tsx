import { useCallback, useState, type FormEvent } from "react";
import { IconChevronDown, IconInfoCircle } from "@tabler/icons-react";
import { LANG_OPTIONS, type Lang, type Translations } from "@/lib/i18n";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export interface SiteNavbarProps {
  language: Lang;
  onLanguageChange: (lang: Lang) => void;
  t: Translations;
}

export function SiteNavbar({ language, onLanguageChange, t }: SiteNavbarProps) {
  const [aboutOpen, setAboutOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [feedbackEmail, setFeedbackEmail] = useState("");

  const handleFeedbackSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      const msg = feedbackMessage.trim();
      if (!msg) return;
      const parts = [msg];
      const em = feedbackEmail.trim();
      if (em) parts.push(`Contact: ${em}`);
      const body = encodeURIComponent(parts.join("\n\n"));
      const subject = encodeURIComponent(t.feedbackEmailSubject);
      window.location.href = `mailto:?subject=${subject}&body=${body}`;
      setFeedbackOpen(false);
      setFeedbackMessage("");
      setFeedbackEmail("");
    },
    [feedbackMessage, feedbackEmail, t.feedbackEmailSubject]
  );

  return (
    <>
      <nav
        className="sticky top-0 z-40 w-full bg-transparent"
        aria-label="Main"
      >
        <div className="mx-auto flex w-full max-w-[1200px] items-center justify-between gap-[var(--space-3)] px-[var(--space-5)] py-[var(--space-3)] md:px-[var(--space-8)]">
          <div className="flex min-w-0 items-center gap-[var(--space-2)]">
            <div
              className={cn(
                "flex h-[56px] shrink-0 items-center gap-2 rounded-[9999px] border-0 bg-[var(--color-basics-white)] px-4",
              )}
            >
              <span
                className="text-[18px] font-normal italic leading-none tracking-[-0.02em] text-foreground"
                style={{ fontFamily: "var(--font-serif)" }}
              >
                {t.navbarLogoShort}
              </span>
              <span className="shrink-0 rounded-[var(--radius-sm)] bg-[var(--color-primary)] px-[6px] py-[2px] text-[10px] font-semibold tracking-wide text-[var(--color-primary-text)] uppercase">
                {t.navbarBeta}
              </span>
            </div>
            <Button
              type="button"
              variant="outline"
              size="icon-lg"
              className="size-[56px] min-h-[56px] min-w-[56px] shrink-0 rounded-[9999px] border-0 bg-[var(--color-basics-white)] p-0 shadow-none"
              aria-label={t.navbarAboutAria}
              onClick={() => setAboutOpen(true)}
            >
              <IconInfoCircle aria-hidden className="size-5" stroke={1.5} />
            </Button>
          </div>

          <div className="flex shrink-0 items-center gap-[var(--space-2)]">
            <Button
              type="button"
              variant="outline"
              className="h-[56px] rounded-[9999px] border-0 bg-[var(--color-basics-white)] px-4 font-sans text-[14px] font-medium shadow-none"
              onClick={() => setFeedbackOpen(true)}
            >
              {t.navbarFeedback}
            </Button>
            <div className="relative">
              <label className="sr-only" htmlFor="site-navbar-language">
                {t.languageLabel}
              </label>
              <select
                id="site-navbar-language"
                value={language}
                onChange={(e) => onLanguageChange(e.target.value as Lang)}
                className={[
                  "h-[56px] min-h-[56px] w-[88px] cursor-pointer appearance-none rounded-[9999px] border-0 bg-[var(--color-basics-white)]",
                  "py-0 pr-7 pl-4 font-sans text-[14px] font-medium text-foreground",
                  "transition-colors hover:bg-[var(--color-beige-50)]",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-300)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-beige-25)]",
                ].join(" ")}
              >
                {LANG_OPTIONS.map(({ code, label }) => (
                  <option key={code} value={code}>
                    {code.toUpperCase()}
                  </option>
                ))}
              </select>
              <IconChevronDown
                aria-hidden
                className="pointer-events-none absolute top-1/2 right-[10px] size-[18px] -translate-y-1/2 text-foreground"
                stroke={1.75}
              />
            </div>
          </div>
        </div>
      </nav>

      <Dialog open={aboutOpen} onOpenChange={setAboutOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t.aboutModalTitle}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-[14px] leading-[1.55] text-foreground">
            {t.aboutModalBody.split("\n\n").map((paragraph, i) => (
              <p key={i} className="m-0">
                {paragraph}
              </p>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={feedbackOpen}
        onOpenChange={(open) => {
          setFeedbackOpen(open);
          if (!open) {
            setFeedbackMessage("");
            setFeedbackEmail("");
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t.feedbackModalTitle}</DialogTitle>
            <DialogDescription>{t.feedbackModalDesc}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleFeedbackSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="feedback-message">{t.feedbackFieldMessage}</Label>
              <Textarea
                id="feedback-message"
                value={feedbackMessage}
                onChange={(e) => setFeedbackMessage(e.target.value)}
                placeholder={t.feedbackPlaceholderMessage}
                rows={5}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="feedback-email">{t.feedbackFieldEmail}</Label>
              <Input
                id="feedback-email"
                type="email"
                value={feedbackEmail}
                onChange={(e) => setFeedbackEmail(e.target.value)}
                placeholder={t.feedbackPlaceholderEmail}
                autoComplete="email"
              />
            </div>
            <Button type="submit" className="w-full sm:w-auto sm:self-end">
              {t.feedbackSubmit}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
