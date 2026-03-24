import { Card as ShadCard } from "@/components/ui/card";
import { Avatar, type AvatarPersona } from "@/components/ds/avatar";
import type { StatusVariant } from "@/lib/ui-status";

export interface MetricCardProps {
  label: string;
  value: string | number;
  variant?: StatusVariant;
  kind?: "default" | "users";
  personas?: AvatarPersona[];
}

export function MetricCard({ label, value, kind = "default", personas = [] }: MetricCardProps) {
  const showUsersCluster = kind === "users" && personas.length > 0;
  const visiblePersonas = personas.slice(0, 3);

  return (
    <ShadCard className="flex h-[190px] flex-col items-center justify-center gap-2 rounded-[32px] border-0 bg-[var(--color-basics-white)] p-[30px] text-center shadow-none">
      <div className="flex w-full items-center justify-center">
        {showUsersCluster ? (
          <div className="flex items-center justify-center">
            {visiblePersonas.map((persona, index) => (
              <div
                key={`${persona.name}-${index}`}
                className={index === 0 ? "" : "-ml-2"}
                style={{ zIndex: visiblePersonas.length - index }}
              >
                <Avatar persona={persona} size={48} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-[48px] leading-none font-bold text-[var(--color-error-1)]">{value}</div>
        )}
      </div>
      <div className="text-[14px] leading-none font-semibold tracking-[1px] text-foreground uppercase">{label}</div>
    </ShadCard>
  );
}
