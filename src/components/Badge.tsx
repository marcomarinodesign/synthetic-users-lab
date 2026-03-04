import { tokens as T } from "@/styles/tokens";
import type { ReactNode } from "react";

type BadgeVariant = "default" | "success" | "warning" | "error" | "info";

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  dot?: boolean;
}

const variants: Record<BadgeVariant, { bg: string; text: string; dot: string }> = {
  default: { bg: T.beige50, text: T.black, dot: T.black },
  success: { bg: T.accent100, text: T.accent700, dot: T.accent700 },
  warning: { bg: T.warning2, text: T.warning1, dot: T.warning1 },
  error: { bg: T.error3, text: T.error1, dot: T.error1 },
  info: { bg: T.info2, text: T.info1, dot: T.info1 },
};

export function Badge({ children, variant = "default", dot = false }: BadgeProps) {
  const v = variants[variant];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        padding: "4px 10px",
        fontSize: "12px",
        fontWeight: 700,
        lineHeight: "16px",
        borderRadius: T.rFull,
        background: v.bg,
        color: v.text,
      }}
    >
      {dot && (
        <span
          style={{
            width: "6px",
            height: "6px",
            borderRadius: "50%",
            background: v.dot,
            flexShrink: 0,
          }}
        />
      )}
      {children}
    </span>
  );
}
