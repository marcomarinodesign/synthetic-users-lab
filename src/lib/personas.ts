import type { Persona, SourceOption } from "@/types";

export const PRESET_PERSONAS: Persona[] = [
  { id: "early-adopter", name: "Early Adopter Tech", initials: "EA", avatarBg: "#EEFFC7", avatarColor: "#4D8605", description: "Usuario técnico, tolera bugs, busca innovación. Evalúa si el concepto es potente aunque la ejecución sea rough.", traits: ["Tolerante con bugs", "Busca innovación", "Da feedback técnico", "Compara con alternativas"], frustration: "low", techLevel: "high" },
  { id: "busy-manager", name: "Manager Ocupado", initials: "MO", avatarBg: "#FFEBC6", avatarColor: "#E89E1B", description: "Poco tiempo, necesita entender el valor en 10 segundos. Si no lo ve claro, abandona.", traits: ["Impaciente", "Orientado a resultados", "Delega tareas", "Busca ROI claro"], frustration: "high", techLevel: "medium" },
  { id: "skeptic", name: "Escéptico Pragmático", initials: "EP", avatarBg: "#DBEAFE", avatarColor: "#1447E6", description: "Ha visto muchas herramientas fallar. Necesita pruebas concretas y casos de uso reales.", traits: ["Desconfiado", "Pide evidencia", "Compara precios", "Busca casos de éxito"], frustration: "medium", techLevel: "medium" },
  { id: "non-tech", name: "Usuario No Técnico", initials: "NT", avatarBg: "#FFE0E0", avatarColor: "#DC2625", description: "No entiende jerga técnica. Si la UI no es obvia, se pierde. Representa al mainstream.", traits: ["Necesita guía visual", "Se frustra fácil", "No lee instrucciones", "Pregunta mucho"], frustration: "high", techLevel: "low" },
  { id: "power-user", name: "Power User", initials: "PU", avatarBg: "#DBFF95", avatarColor: "#4D8605", description: "Usa el producto al máximo. Encuentra edge cases, quiere atajos y personalización.", traits: ["Explora todo", "Busca atajos", "Reporta bugs detallados", "Quiere API/integraciones"], frustration: "low", techLevel: "high" },
  { id: "switcher", name: "Switcher Insatisfecho", initials: "SI", avatarBg: "#F5F5EB", avatarColor: "#000000", description: "Viene de usar un competidor y busca algo mejor. Compara cada detalle con lo que ya conoce.", traits: ["Compara con competencia", "Expectativas altas", "Busca migración fácil", "Sensible a regresiones"], frustration: "medium", techLevel: "high" },
  { id: "budget-owner", name: "Decisor de Compra", initials: "DC", avatarBg: "#FECACA", avatarColor: "#DC2625", description: "Es quien aprueba el presupuesto. No usa el producto directamente pero necesita entender el valor.", traits: ["Evalúa coste-beneficio", "Pricing transparente", "Necesita justificar compra", "Poco tiempo"], frustration: "high", techLevel: "low" },
  { id: "mobile-first", name: "Mobile-First User", initials: "MF", avatarBg: "#DBEAFE", avatarColor: "#1447E6", description: "Hace todo desde el móvil. Si la experiencia no es responsive, abandona.", traits: ["Solo usa móvil", "Sensible a rendimiento", "Gestos táctiles", "No tolera scroll horizontal"], frustration: "high", techLevel: "medium" },
];

export const SOURCE_TYPES: SourceOption[] = [
  { id: "url", label: "URL", icon: "🌐", placeholder: "https://tu-app.com/flujo-onboarding" },
  { id: "figma", label: "Figma", icon: "🎨", placeholder: "Describe las pantallas del flujo en Figma..." },
  { id: "repo", label: "Repo", icon: "📦", placeholder: "Describe la estructura de rutas y componentes..." },
  { id: "description", label: "Manual", icon: "📝", placeholder: "Describe el flujo paso a paso..." },
];
