import { tokens as T } from "@/styles/tokens";
import type { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  block?: boolean;
}

const base = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "8px",
  height: "40px",
  padding: "0 24px",
  fontSize: "16px",
  fontWeight: 600,
  fontFamily: T.font,
  lineHeight: "22px",
  borderRadius: T.rFull,
  border: "none",
  outline: "none",
  cursor: "pointer",
  transition: "background 0.15s, opacity 0.15s",
} as const;

export function BtnPrimary({ children, disabled, block, style, ...rest }: ButtonProps) {
  return (
    <button
      disabled={disabled}
      style={{
        ...base,
        background: disabled ? "rgba(0,0,0,0.5)" : T.primary,
        color: T.primaryText,
        cursor: disabled ? "not-allowed" : "pointer",
        width: block ? "100%" : "auto",
        ...style,
      }}
      {...rest}
    >
      {children}
    </button>
  );
}

export function BtnSecondary({ children, block, style, ...rest }: ButtonProps) {
  return (
    <button
      style={{
        ...base,
        background: T.secondary,
        color: T.secondaryText,
        width: block ? "100%" : "auto",
        ...style,
      }}
      {...rest}
    >
      {children}
    </button>
  );
}

export function BtnTertiary({ children, style, ...rest }: ButtonProps) {
  return (
    <button
      style={{
        ...base,
        background: T.white,
        color: T.black,
        border: `1px solid ${T.tertiaryBorder}`,
        width: "auto",
        ...style,
      }}
      {...rest}
    >
      {children}
    </button>
  );
}
