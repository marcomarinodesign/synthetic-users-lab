export type PersonaGroup = "core" | "region" | "industry" | "accessibility" | "custom";

export interface Persona {
  id: string;
  name: string;
  initials: string;
  avatarBg: string;
  avatarColor: string;
  avatarPhoto?: string;
  category: "simple" | "pro";
  group: PersonaGroup;
  description: string;
  traits: string[];
  frustration: "low" | "medium" | "high";
  techLevel: "low" | "medium" | "high";
}
