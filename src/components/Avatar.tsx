import { tokens as T } from "@/styles/tokens";
import type { Persona } from "@/types";

interface AvatarProps {
  persona: Pick<Persona, "name" | "initials" | "avatarBg" | "avatarColor">;
  size?: number;
}

export function Avatar({ persona, size = 40 }: AvatarProps) {
  const initials =
    persona.initials ||
    persona.name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        flexShrink: 0,
        background: persona.avatarBg || T.accent100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.38,
        fontWeight: 800,
        color: persona.avatarColor || T.accent700,
        letterSpacing: "-0.02em",
        fontFamily: T.font,
        lineHeight: 1,
      }}
    >
      {initials}
    </div>
  );
}
