export interface Persona {
  id: string;
  name: string;
  initials: string;
  avatarBg: string;
  avatarColor: string;
  avatarPhoto?: string;
  category: "simple" | "pro";
  description: string;
  traits: string[];
  frustration: "low" | "medium" | "high";
  techLevel: "low" | "medium" | "high";
}
