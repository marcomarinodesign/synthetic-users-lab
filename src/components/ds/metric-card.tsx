import { Badge as ShadBadge } from "@/components/ui/badge";
import { Card as ShadCard } from "@/components/ui/card";
import { getStatusVariantBadgeClass, type StatusVariant } from "@/lib/ui-status";

export interface MetricCardProps {
  label: string;
  value: string | number;
  variant: StatusVariant;
}

export function MetricCard({ label, value, variant }: MetricCardProps) {
  return (
    <ShadCard className="border border-[var(--color-tertiary-border)] p-4 text-center shadow-xs">
      <div className="mb-1.5 text-3xl font-extrabold text-foreground">{value}</div>
      <ShadBadge variant="outline" className={`border ${getStatusVariantBadgeClass(variant)}`}>
        {label}
      </ShadBadge>
    </ShadCard>
  );
}
