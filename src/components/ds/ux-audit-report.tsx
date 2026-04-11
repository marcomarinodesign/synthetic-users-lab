import type { UxAuditIssue, UxAuditReport, UxAuditSeverity } from "@/types";

const SEVERITY_STYLES: Record<UxAuditSeverity, { pill: string; label: string }> = {
  P1: {
    pill: "inline-flex items-center rounded-[var(--radius-md)] bg-[#fde8e8] px-2 py-1 text-[13px] font-semibold leading-none text-[#b91c1c]",
    label: "P1 — High",
  },
  P2: {
    pill: "inline-flex items-center rounded-[var(--radius-md)] bg-[#fef3c7] px-2 py-1 text-[13px] font-semibold leading-none text-[#92400e]",
    label: "P2 — Medium",
  },
  P3: {
    pill: "inline-flex items-center rounded-[var(--radius-md)] bg-[#e0f2fe] px-2 py-1 text-[13px] font-semibold leading-none text-[#075985]",
    label: "P3 — Low",
  },
};

const LAW_BADGE =
  "inline-flex items-center rounded-[var(--radius-full)] border border-[var(--color-tertiary-border)] bg-[var(--color-basics-white)] px-2 py-1 text-[12px] font-normal leading-none text-foreground";

function IssueCard({ issue }: { issue: UxAuditIssue }) {
  const sev = SEVERITY_STYLES[issue.severity] ?? SEVERITY_STYLES.P2;
  return (
    <div className="flex flex-col gap-4 rounded-[20px] border border-[var(--color-tertiary-border)] bg-[var(--color-basics-white)] p-6">
      <div className="flex flex-wrap items-center gap-2">
        <span className={sev.pill}>{sev.label}</span>
        <span className={LAW_BADGE}>{issue.uxLaw}</span>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-2">
          <p className="m-0 text-[12px] font-bold uppercase tracking-[0.05em] text-foreground/60">Observation</p>
          <p className="m-0 text-[14px] leading-[1.5] text-foreground">{issue.observation}</p>
        </div>
        <div className="flex flex-col gap-2">
          <p className="m-0 text-[12px] font-bold uppercase tracking-[0.05em] text-foreground/60">Impact</p>
          <p className="m-0 text-[14px] leading-[1.5] text-foreground">{issue.impact}</p>
        </div>
        <div className="flex flex-col gap-2">
          <p className="m-0 text-[12px] font-bold uppercase tracking-[0.05em] text-foreground/60">Recommendation</p>
          <p className="m-0 text-[14px] font-medium leading-[1.5] text-foreground">{issue.recommendation}</p>
        </div>
      </div>
    </div>
  );
}

export interface UxAuditReportProps {
  report: UxAuditReport;
  personaName: string;
  flowLabel?: string;
}

export function UxAuditReportCard({ report, personaName, flowLabel }: UxAuditReportProps) {
  const p1 = report.issues.filter((i) => i.severity === "P1");
  const p2 = report.issues.filter((i) => i.severity === "P2");
  const p3 = report.issues.filter((i) => i.severity === "P3");

  return (
    <div className="flex flex-col gap-[var(--space-12)] px-[var(--space-12)] py-[var(--space-12)]">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h2 className="m-0 font-serif text-[36px] font-normal italic leading-normal text-foreground">
          UX Audit
        </h2>
        <p className="m-0 text-[14px] text-foreground/60">
          {personaName}{flowLabel ? ` · ${flowLabel}` : ""}
        </p>
      </div>

      {/* Issues by severity */}
      {[
        { label: "P1 — High severity", items: p1 },
        { label: "P2 — Medium severity", items: p2 },
        { label: "P3 — Low severity / Quick wins", items: p3 },
      ].map(({ label, items }) =>
        items.length > 0 ? (
          <section key={label} className="flex flex-col gap-[var(--space-6)]">
            <div className="h-px bg-[var(--color-beige-25)]" />
            <h3 className="m-0 font-sans text-[18px] font-bold leading-normal text-foreground">{label}</h3>
            <div className="flex flex-col gap-4">
              {items.map((issue, i) => (
                <IssueCard key={i} issue={issue} />
              ))}
            </div>
          </section>
        ) : null
      )}

      {/* Strengths */}
      {report.strengths.length > 0 && (
        <section className="flex flex-col gap-[var(--space-6)]">
          <div className="h-px bg-[var(--color-beige-25)]" />
          <h3 className="m-0 font-sans text-[18px] font-bold leading-normal text-foreground">Strengths</h3>
          <ul className="m-0 flex flex-col gap-3 p-0 list-none">
            {report.strengths.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-[15px] leading-[1.5] text-foreground">
                <span className="mt-[2px] shrink-0 text-[16px]">✓</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Prioritization */}
      {report.prioritization.length > 0 && (
        <section className="flex flex-col gap-[var(--space-6)]">
          <div className="h-px bg-[var(--color-beige-25)]" />
          <h3 className="m-0 font-sans text-[18px] font-bold leading-normal text-foreground">
            Recommended prioritization
          </h3>
          <ol className="m-0 flex flex-col gap-3 p-0 list-none">
            {report.prioritization.map((action, i) => (
              <li key={i} className="flex items-start gap-3 text-[15px] leading-[1.5] text-foreground">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)] text-[12px] font-bold text-white">
                  {i + 1}
                </span>
                <span>{action}</span>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* Metrics */}
      {report.metrics.length > 0 && (
        <section className="flex flex-col gap-[var(--space-6)]">
          <div className="h-px bg-[var(--color-beige-25)]" />
          <h3 className="m-0 font-sans text-[18px] font-bold leading-normal text-foreground">
            Metrics to monitor
          </h3>
          <ul className="m-0 flex flex-wrap gap-2 p-0 list-none">
            {report.metrics.map((m, i) => (
              <li
                key={i}
                className="inline-flex items-center rounded-[var(--radius-full)] border border-[var(--color-tertiary-border)] bg-[var(--color-beige-25)] px-3 py-1.5 text-[13px] font-normal text-foreground"
              >
                {m}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
