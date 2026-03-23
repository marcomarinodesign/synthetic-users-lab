import type { CSSProperties } from "react";
import type { Persona } from "@/types";

export type AvatarPersona = Pick<Persona, "avatarBg" | "avatarColor" | "initials" | "name" | "avatarPhoto">;

export interface AvatarProps {
  persona: AvatarPersona;
  size?: number;
  border?: string;
}

export function Avatar({ persona, size = 40, border }: AvatarProps) {
  const bg = persona.avatarBg || "var(--color-accent-100)";
  const color = persona.avatarColor || "var(--color-accent-700)";
  const initials =
    persona.initials ||
    persona.name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  const fontSize = size * 0.38;
  const baseStyle: CSSProperties = {
    width: size,
    height: size,
    borderRadius: "50%",
    flexShrink: 0,
    overflow: "hidden",
    border: border || "none",
    boxSizing: "border-box",
  };
  if (persona.avatarPhoto) {
    return (
      <div style={{ ...baseStyle, background: "var(--color-basics-white)" }}>
        <img
          src={persona.avatarPhoto}
          alt={persona.name}
          className="block size-full object-contain object-center"
          loading="lazy"
          decoding="async"
        />
      </div>
    );
  }
  return (
    <div
      style={{
        ...baseStyle,
        background: bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize,
        fontWeight: 800,
        color,
        letterSpacing: "-0.02em",
        fontFamily: "var(--font-sans)",
        lineHeight: 1,
      }}
    >
      {initials}
    </div>
  );
}
