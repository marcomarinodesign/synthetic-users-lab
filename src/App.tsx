import { useState, useCallback, useEffect, useRef, type CSSProperties, type ReactNode } from "react";

/* ─── Types ─── */
type FrustrationLevel = "low" | "medium" | "high";
type TechLevel = "low" | "medium" | "high";
type IssueSeverity = "critical" | "warning" | "info";
type BadgeVariant = "default" | "success" | "warning" | "error" | "info";

interface Persona {
  id: string;
  name: string;
  initials: string;
  avatarBg: string;
  avatarColor: string;
  avatarPhoto?: string;
  description: string;
  traits: string[];
  frustration: FrustrationLevel;
  techLevel: TechLevel;
}

interface SimStep {
  action: string;
  reaction: string;
}

interface Issue {
  severity: IssueSeverity;
  description: string;
}

interface SimulationResult {
  personaId: string;
  score: number;
  summary: string;
  steps: SimStep[];
  issues: Issue[];
  wouldReturn: boolean | null;
  verbatim?: string;
}

/* ─── Plinng DS Tokens ─── */
const T = {
  primary: "#000000",
  primaryText: "#FFFFFF",
  secondary: "#BEFF50",
  secondaryText: "#000000",
  tertiary: "#FFFFFF",
  tertiaryBorder: "#EBEBEB",
  disabled: "#949494",
  accent100: "#EEFFC7",
  accent200: "#DBFF95",
  accent300: "#BEFF50",
  accent500: "#86DD05",
  accent700: "#4D8605",
  beige25: "#FBFBF7",
  beige50: "#F5F5EB",
  beige100: "#DCDCCB",
  beige200: "#D0CFB8",
  beige300: "#B4B290",
  greySoft: "#EBEBEB",
  greySoftMiddle: "#D8D8D8",
  greyMiddle: "#C3C3C3",
  greyDark: "#949494",
  textSecondary: "#95958F",
  white: "#FFFFFF",
  black: "#000000",
  error1: "#DC2625",
  error2: "#FECACA",
  error3: "#FFE0E0",
  warning1: "#E89E1B",
  warning2: "#FFEBC6",
  info1: "#1447E6",
  info2: "#DBEAFE",
  rSm: "4px",
  rMd: "8px",
  rLg: "12px",
  rXl: "16px",
  r2xl: "24px",
  rFull: "9999px",
  shadowSm: "0 1px 2px 0 rgba(0,0,0,0.05)",
  shadowMd: "0 4px 6px -1px rgba(0,0,0,0.10), 0 2px 4px -2px rgba(0,0,0,0.10)",
  shadowLg: "0 10px 15px -3px rgba(0,0,0,0.10), 0 4px 6px -4px rgba(0,0,0,0.10)",
  shadowXl: "0 20px 25px -5px rgba(0,0,0,0.10), 0 8px 10px -6px rgba(0,0,0,0.10)",
  font: "'Inter', sans-serif",
};

const PRESET_PERSONAS: Persona[] = [
  { id: "early-adopter", name: "Early Adopter Tech", initials: "EA", avatarBg: "#EEFFC7", avatarColor: "#4D8605", avatarPhoto: "https://i.pravatar.cc/120?img=11", description: "Usuario técnico, tolera bugs, busca innovación. Evalúa si el concepto es potente aunque la ejecución sea rough.", traits: ["Tolerante con bugs", "Busca innovación", "Da feedback técnico", "Compara con alternativas"], frustration: "low", techLevel: "high" },
  { id: "busy-manager", name: "Manager Ocupado", initials: "MO", avatarBg: "#FFEBC6", avatarColor: "#E89E1B", avatarPhoto: "https://i.pravatar.cc/120?img=33", description: "Poco tiempo, necesita entender el valor en 10 segundos. Si no lo ve claro, abandona.", traits: ["Impaciente", "Orientado a resultados", "Delega tareas", "Busca ROI claro"], frustration: "high", techLevel: "medium" },
  { id: "skeptic", name: "Escéptico Pragmático", initials: "EP", avatarBg: "#DBEAFE", avatarColor: "#1447E6", avatarPhoto: "https://i.pravatar.cc/120?img=12", description: "Ha visto muchas herramientas fallar. Necesita pruebas concretas y casos de uso reales.", traits: ["Desconfiado", "Pide evidencia", "Compara precios", "Busca casos de éxito"], frustration: "medium", techLevel: "medium" },
  { id: "non-tech", name: "Usuario No Técnico", initials: "NT", avatarBg: "#FFE0E0", avatarColor: "#DC2625", avatarPhoto: "https://i.pravatar.cc/120?img=20", description: "No entiende jerga técnica. Si la UI no es obvia, se pierde. Representa al mainstream.", traits: ["Necesita guía visual", "Se frustra fácil", "No lee instrucciones", "Pregunta mucho"], frustration: "high", techLevel: "low" },
  { id: "power-user", name: "Power User", initials: "PU", avatarBg: "#DBFF95", avatarColor: "#4D8605", avatarPhoto: "https://i.pravatar.cc/120?img=5", description: "Usa el producto al máximo. Encuentra edge cases, quiere atajos y personalización.", traits: ["Explora todo", "Busca atajos", "Reporta bugs detallados", "Quiere API/integraciones"], frustration: "low", techLevel: "high" },
  { id: "switcher", name: "Switcher Insatisfecho", initials: "SI", avatarBg: "#F5F5EB", avatarColor: "#000000", avatarPhoto: "https://i.pravatar.cc/120?img=47", description: "Viene de usar un competidor y busca algo mejor. Compara cada detalle con lo que ya conoce. Si algo es peor que su herramienta anterior, lo nota al instante.", traits: ["Compara con competencia", "Tiene expectativas altas", "Busca migración fácil", "Sensible a regresiones"], frustration: "medium", techLevel: "high" },
  { id: "budget-owner", name: "Decisor de Compra", initials: "DC", avatarBg: "#FECACA", avatarColor: "#DC2625", avatarPhoto: "https://i.pravatar.cc/120?img=60", description: "Es quien aprueba el presupuesto. No usa el producto directamente pero necesita entender el valor para justificar la inversión ante su equipo.", traits: ["Evalúa coste-beneficio", "Pricing transparente", "Necesita justificar compra", "Poco tiempo"], frustration: "high", techLevel: "low" },
  { id: "mobile-first", name: "Mobile-First User", initials: "MF", avatarBg: "#DBEAFE", avatarColor: "#1447E6", avatarPhoto: "https://i.pravatar.cc/120?img=15", description: "Hace todo desde el móvil. Si la experiencia no es responsive, abandona. Usa el pulgar, poco ancho de banda, cero paciencia con carga lenta.", traits: ["Solo usa móvil", "Sensible a rendimiento", "Gestos táctiles", "No tolera scroll horizontal"], frustration: "high", techLevel: "medium" },
];

type AvatarPersona = Pick<Persona, "avatarBg" | "avatarColor" | "initials" | "name" | "avatarPhoto">;

interface AvatarProps {
  persona: AvatarPersona;
  size?: number;
  border?: string;
}

function Avatar({ persona, size = 40, border }: AvatarProps) {
  const bg = persona.avatarBg || T.accent100;
  const color = persona.avatarColor || T.accent700;
  const initials = persona.initials || persona.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  const fontSize = size * 0.38;
  const baseStyle: CSSProperties = {
    width: size, height: size, borderRadius: "50%", flexShrink: 0, overflow: "hidden",
    border: border || "none", boxSizing: "border-box",
  };
  if (persona.avatarPhoto) {
    return (
      <div style={{ ...baseStyle, background: bg }}>
        <img src={persona.avatarPhoto} alt={persona.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
      </div>
    );
  }
  return (
    <div style={{
      ...baseStyle,
      background: bg, display: "flex", alignItems: "center", justifyContent: "center",
      fontSize, fontWeight: 800, color, letterSpacing: "-0.02em", fontFamily: T.font, lineHeight: 1,
    }}>{initials}</div>
  );
}

const SOURCE_TYPES = [
  { id: "url", label: "URL", icon: "🌐", placeholder: "https://tu-app.com/flujo-onboarding" },
  { id: "figma", label: "Figma", icon: "🎨", placeholder: "Describe las pantallas del flujo en Figma..." },
  { id: "repo", label: "Repo", icon: "📦", placeholder: "Describe la estructura de rutas y componentes..." },
  { id: "description", label: "Manual", icon: "📝", placeholder: "Describe el flujo paso a paso..." },
];

/* ─── DS-aligned styles ─── */
const inputStyle: CSSProperties = {
  width: "100%", height: "40px", padding: "0 16px",
  background: T.white, border: `1px solid ${T.tertiaryBorder}`,
  borderRadius: T.rMd, color: T.black,
  fontSize: "16px", lineHeight: "22px", fontFamily: T.font,
  outline: "none", boxSizing: "border-box",
  transition: "border-color 0.15s",
};
const textareaStyle: CSSProperties = {
  ...inputStyle, height: "auto", padding: "10px 16px",
  resize: "vertical", lineHeight: 1.5,
};
const labelStyle: CSSProperties = {
  fontSize: "14px", fontWeight: 600, lineHeight: "1",
  color: T.black, marginBottom: "6px", display: "block",
};

/* ─── DS Components ─── */

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  dot?: boolean;
}

function Badge({ children, variant = "default", dot = false }: BadgeProps) {
  const vars: Record<BadgeVariant, { bg: string; text: string; dotC: string }> = {
    default: { bg: T.beige50, text: T.black, dotC: T.black },
    success: { bg: T.accent100, text: T.accent700, dotC: T.accent700 },
    warning: { bg: T.warning2, text: T.warning1, dotC: T.warning1 },
    error: { bg: T.error3, text: T.error1, dotC: T.error1 },
    info: { bg: T.info2, text: T.info1, dotC: T.info1 },
  };
  const v = vars[variant];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "4px",
      padding: "4px 10px", fontSize: "12px", fontWeight: 700,
      lineHeight: "16px", borderRadius: T.rFull,
      background: v.bg, color: v.text,
    }}>
      {dot && <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: v.dotC, flexShrink: 0 }} />}
      {children}
    </span>
  );
}

interface BtnPrimaryProps {
  children: ReactNode;
  disabled?: boolean;
  onClick?: () => void;
  block?: boolean;
  style?: CSSProperties;
}

function BtnPrimary({ children, disabled, onClick, block, style: s }: BtnPrimaryProps) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px",
      height: "40px", padding: "0 24px",
      background: disabled ? "rgba(0,0,0,0.5)" : T.primary,
      color: T.primaryText, fontSize: "16px", fontWeight: 600, fontFamily: T.font,
      lineHeight: "22px", border: "none", borderRadius: T.rFull,
      cursor: disabled ? "not-allowed" : "pointer", outline: "none",
      transition: "background 0.15s",
      width: block ? "100%" : "auto", ...s,
    }}>{children}</button>
  );
}

interface BtnSecondaryProps {
  children: ReactNode;
  onClick?: () => void;
  block?: boolean;
  style?: CSSProperties;
}

function BtnSecondary({ children, onClick, block, style: s }: BtnSecondaryProps) {
  return (
    <button onClick={onClick} style={{
      display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px",
      height: "40px", padding: "0 24px",
      background: T.secondary, color: T.secondaryText,
      fontSize: "16px", fontWeight: 600, fontFamily: T.font,
      lineHeight: "22px", border: "none", borderRadius: T.rFull,
      cursor: "pointer", outline: "none", transition: "background 0.15s",
      width: block ? "100%" : "auto", ...s,
    }}>{children}</button>
  );
}

interface BtnTertiaryProps {
  children: ReactNode;
  onClick?: () => void;
  style?: CSSProperties;
}

function BtnTertiary({ children, onClick, style: s }: BtnTertiaryProps) {
  return (
    <button onClick={onClick} style={{
      display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px",
      height: "40px", padding: "0 24px",
      background: T.white, color: T.black,
      fontSize: "16px", fontWeight: 600, fontFamily: T.font,
      lineHeight: "22px", border: `1px solid ${T.tertiaryBorder}`,
      borderRadius: T.rFull, cursor: "pointer", outline: "none",
      transition: "all 0.15s", ...s,
    }}>{children}</button>
  );
}

interface PersonaCardProps {
  persona: Persona;
  selected: boolean;
  onToggle: (id: string) => void;
}

function PersonaCard({ persona, selected, onToggle }: PersonaCardProps) {
  const techLabel = persona.techLevel === "high" ? "Técnico" : persona.techLevel === "medium" ? "Intermedio" : "No técnico";
  const frustLabel = persona.frustration === "high" ? "alta" : persona.frustration === "medium" ? "media" : "baja";
  return (
    <button onClick={() => onToggle(persona.id)} aria-pressed={selected} style={{
      display: "flex", flexDirection: "column", gap: "0",
      padding: "17px", width: "100%", textAlign: "left",
      background: T.white,
      border: selected ? `2px solid ${T.black}` : `1px solid ${T.tertiaryBorder}`,
      borderRadius: T.rXl, cursor: "pointer", outline: "none",
      transition: "all 0.15s", boxShadow: T.shadowSm,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px", width: "100%" }}>
        <Avatar persona={persona} size={60} border={`2px solid ${T.beige25}`} />
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ fontSize: "12px", fontWeight: 400, color: T.black, lineHeight: "18px" }}>
            {techLabel} · Frustración {frustLabel}
          </div>
          <div style={{ fontSize: "15px", fontWeight: 700, color: T.black, lineHeight: "18px" }}>{persona.name}</div>
          <p style={{ margin: 0, fontSize: "13px", lineHeight: "19.5px", color: T.black }}>{persona.description}</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {persona.traits.map(t => (
              <span key={t} style={{
                display: "inline-block", padding: "3px 10px",
                fontSize: "11px", fontWeight: 700, borderRadius: T.rFull,
                background: selected ? T.accent200 : T.beige50, color: T.black, lineHeight: "16px",
              }}>{t}</span>
            ))}
          </div>
        </div>
        {selected && <span style={{
          width: "22px", height: "22px", borderRadius: "50%", background: T.primary,
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          fontSize: "12px", color: T.white, fontWeight: 700,
        }}>✓</span>}
      </div>
    </button>
  );
}

interface ProgressBarProps {
  steps: string[];
  current: number;
}

function ProgressBar({ steps, current }: ProgressBarProps) {
  const pct = (current / (steps.length - 1)) * 100;
  return (
    <div style={{ marginBottom: "32px" }}>
      <div style={{ position: "relative", height: "6px", background: T.greySoft, borderRadius: "3px", overflow: "hidden", marginBottom: "14px" }}>
        <div style={{
          position: "absolute", top: 0, left: 0, height: "100%",
          width: `${pct}%`, background: T.primary, borderRadius: "3px",
          transition: "width 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
        }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        {steps.map((s, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <div style={{
              width: i === current ? "10px" : "8px",
              height: i === current ? "10px" : "8px",
              borderRadius: "50%",
              background: i <= current ? T.primary : T.greyMiddle,
              border: i === current ? "2px solid rgba(0,0,0,0.2)" : "none",
              transition: "all 0.3s", flexShrink: 0,
            }} />
            <span style={{
              fontSize: "13px", fontWeight: i === current ? 700 : 400,
              color: i <= current ? T.black : T.greyDark,
              transition: "all 0.3s",
            }}>{s}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children?: ReactNode;
  footer?: ReactNode;
}

function Modal({ open, onClose, title, description, children, footer }: ModalProps) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const el = ref.current;
    if (el) {
      const f = el.querySelectorAll("input,textarea,button:not([disabled])");
      if (f.length) (f[0] as HTMLElement).focus();
    }
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);
  if (!open) return null;
  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose(); }} style={{
      position: "fixed", inset: 0, zIndex: 50,
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "16px", background: "rgba(0,0,0,0.4)", backdropFilter: "blur(6px)",
      animation: "pFadeIn 0.2s ease",
    }}>
      <style>{`@keyframes pFadeIn{from{opacity:0}to{opacity:1}} @keyframes pSlideUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <div ref={ref} role="dialog" aria-modal="true" tabIndex={-1} onKeyDown={e => { if (e.key === "Escape") onClose(); }} style={{
        width: "100%", maxWidth: "460px", maxHeight: "90vh",
        background: T.white, borderRadius: T.r2xl,
        boxShadow: T.shadowSm, display: "flex", flexDirection: "column",
        outline: "none", animation: "pSlideUp 0.25s ease",
      }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px", padding: "24px 24px 0" }}>
          <div>
            {title && <h2 style={{ margin: "0 0 4px", fontSize: "18px", fontWeight: 600, lineHeight: "24px", color: T.black }}>{title}</h2>}
            {description && <p style={{ margin: 0, fontSize: "14px", color: T.textSecondary, lineHeight: "20px" }}>{description}</p>}
          </div>
          <button onClick={onClose} aria-label="Cerrar modal" style={{
            flexShrink: 0, width: "32px", height: "32px", borderRadius: T.rMd,
            background: "none", border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: T.greyDark, transition: "color 0.15s",
          }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M4 4l10 10M14 4L4 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 24px", fontSize: "14px", color: T.black, lineHeight: "22px" }}>
          {children}
        </div>
        {footer && <div style={{ display: "flex", gap: "12px", padding: "8px 24px 24px", justifyContent: "flex-end" }}>{footer}</div>}
      </div>
    </div>
  );
}

interface ResultCardProps {
  result: SimulationResult;
  index: number;
}

function ResultCard({ result, index }: ResultCardProps) {
  const [open, setOpen] = useState(index === 0);
  const persona: AvatarPersona = PRESET_PERSONAS.find(p => p.id === result.personaId) ?? { name: "Custom", initials: "CU", avatarBg: T.accent100, avatarColor: T.accent700 };
  const sc = result.score || 0;
  const scoreVariant: BadgeVariant = sc >= 7 ? "success" : sc >= 4 ? "warning" : "error";
  const sevMap: Record<IssueSeverity, BadgeVariant> = { critical: "error", warning: "warning", info: "info" };

  return (
    <div style={{ background: T.white, border: `1px solid ${T.tertiaryBorder}`, borderRadius: T.rXl, overflow: "hidden", boxShadow: T.shadowSm }}>
      <button onClick={() => setOpen(!open)} aria-expanded={open} style={{
        width: "100%", display: "flex", alignItems: "center", gap: "14px",
        padding: "16px 20px", background: "none", border: "none",
        cursor: "pointer", textAlign: "left", outline: "none", fontFamily: T.font,
      }}>
        <Avatar persona={persona} size={36} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "16px", fontWeight: 600, color: T.black }}>{persona.name}</div>
          <div style={{ fontSize: "14px", color: T.textSecondary, marginTop: "2px" }}>
            {result.issues?.length || 0} issues · {result.wouldReturn ? "Volvería" : "No volvería"}
          </div>
        </div>
        <Badge variant={scoreVariant} dot>{sc}/10</Badge>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ color: T.greyDark, transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>
          <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {open && (
        <div style={{ padding: "0 20px 20px", display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ height: "1px", background: T.tertiaryBorder }} />

          {result.summary && <div>
            <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: T.textSecondary, marginBottom: "8px" }}>Resumen</div>
            <p style={{ margin: 0, fontSize: "14px", lineHeight: 1.6, color: T.black }}>{result.summary}</p>
          </div>}

          {result.steps?.length > 0 && <div>
            <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: T.textSecondary, marginBottom: "8px" }}>Recorrido</div>
            <div style={{ borderRadius: T.rMd, overflow: "hidden", border: `1px solid ${T.tertiaryBorder}` }}>
              {result.steps.map((s, si) => (
                <div key={si} style={{ display: "flex", gap: "12px", padding: "12px 14px", background: si % 2 === 0 ? T.white : T.beige25, borderTop: si > 0 ? `1px solid ${T.tertiaryBorder}` : "none" }}>
                  <span style={{ fontSize: "12px", fontWeight: 700, color: T.accent700, background: T.accent100, borderRadius: "6px", minWidth: "24px", height: "22px", display: "flex", alignItems: "center", justifyContent: "center" }}>{si + 1}</span>
                  <div>
                    <div style={{ fontSize: "14px", fontWeight: 600, color: T.black }}>{s.action}</div>
                    <div style={{ fontSize: "14px", color: T.textSecondary, marginTop: "2px", lineHeight: 1.45 }}>{s.reaction}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>}

          {result.issues?.length > 0 && <div>
            <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: T.textSecondary, marginBottom: "8px" }}>Issues</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {result.issues.map((issue, ii) => (
                <div key={ii} style={{ display: "flex", gap: "10px", alignItems: "flex-start", padding: "10px 14px" }}>
                  <Badge variant={sevMap[issue.severity]} dot>{issue.severity === "critical" ? "Crítico" : issue.severity === "warning" ? "Aviso" : "Info"}</Badge>
                  <span style={{ fontSize: "14px", color: T.black, lineHeight: 1.45 }}>{issue.description}</span>
                </div>
              ))}
            </div>
          </div>}

          {result.verbatim && (
            <div style={{ padding: "14px 16px", background: T.beige25, borderRadius: T.rMd, borderLeft: `3px solid ${T.primary}` }}>
              <p style={{ margin: 0, fontSize: "14px", fontStyle: "italic", color: T.textSecondary, lineHeight: 1.5 }}>"{result.verbatim}"</p>
            </div>
          )}

          <div style={{
            display: "flex", alignItems: "center", gap: "8px",
            padding: "10px 14px", borderRadius: T.rMd,
            background: result.wouldReturn ? T.accent100 : T.error3,
            border: `1px solid ${result.wouldReturn ? T.accent300 : T.error2}`,
          }}>
            <span style={{ fontSize: "15px" }}>{result.wouldReturn ? "✅" : "❌"}</span>
            <span style={{ fontSize: "14px", fontWeight: 600, color: T.black }}>
              {result.wouldReturn ? "Volvería a usar el producto" : "No volvería a usar el producto"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Main ─── */
export default function SyntheticUsersLab() {
  const [step, setStep] = useState(0);
  const [selectedPersonas, setSelectedPersonas] = useState<string[]>(["early-adopter", "busy-manager"]);
  const [customPersona, setCustomPersona] = useState({ name: "", description: "", traits: "" });
  const [sourceType, setSourceType] = useState("description");
  const [flowInput, setFlowInput] = useState("");
  const [productContext, setProductContext] = useState("");
  const [results, setResults] = useState<SimulationResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, currentPersona: "" });
  const [showModal, setShowModal] = useState(false);

  const toggle = (id: string) => setSelectedPersonas(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  const canAdd = customPersona.name && customPersona.description;

  const addCustom = () => {
    if (!canAdd) return;
    const id = `custom-${Date.now()}`;
    PRESET_PERSONAS.push({ id, name: customPersona.name, initials: customPersona.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase(), avatarBg: T.beige50, avatarColor: T.black, description: customPersona.description, traits: customPersona.traits.split(",").map(t => t.trim()).filter(Boolean), frustration: "medium", techLevel: "medium" });
    setSelectedPersonas(p => [...p, id]);
    setCustomPersona({ name: "", description: "", traits: "" });
    setShowModal(false);
  };

  const run = useCallback(async () => {
    setLoading(true); setResults(null);
    const personas = PRESET_PERSONAS.filter(p => selectedPersonas.includes(p.id));
    setProgress({ current: 0, total: personas.length, currentPersona: "" });
    const all: SimulationResult[] = [];
    for (let i = 0; i < personas.length; i++) {
      const p = personas[i];
      setProgress({ current: i + 1, total: personas.length, currentPersona: p.name });
      const sys = `Eres un simulador de usuario sintético para testing de productos digitales.
Actúa EXACTAMENTE como este perfil evaluando un flujo de producto.

PERFIL: ${p.name}
Descripción: ${p.description}
Rasgos: ${p.traits.join(", ")}
Frustración: ${p.frustration} | Nivel técnico: ${p.techLevel}

PRODUCTO: ${productContext || "Sin contexto adicional."}

INSTRUCCIONES:
1. Recorre el flujo paso a paso como este usuario
2. Describe qué haría, pensaría y sentiría en cada paso
3. Identifica fricciones, confusiones y momentos de abandono
4. Sé BRUTALMENTE HONESTO desde esta perspectiva

Responde SOLO JSON válido (sin markdown ni backticks):
{"score":<1-10>,"summary":"<2-3 frases>","steps":[{"action":"<qué hace>","reaction":"<qué piensa>"}],"issues":[{"severity":"critical|warning|info","description":"<problema>"}],"wouldReturn":<bool>,"verbatim":"<frase textual>"}`;
      try {
        const res = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 4096, system: sys, messages: [{ role: "user", content: `FUENTE: ${sourceType.toUpperCase()}\n\nFLUJO:\n${flowInput}` }] })
        });
        if (!res.ok) throw new Error(`API ${res.status}`);
        const data = await res.json();
        const text = data.content?.map((c: { text?: string }) => c.text || "").join("") || "";
        const clean = text.replace(/```json|```/g, "").trim();
        let parsed: Omit<SimulationResult, "personaId"> = { score: 5, summary: "Sin datos.", steps: [], issues: [], wouldReturn: null };
        try { parsed = JSON.parse(clean); } catch {
          let r = clean;
          if ((r.match(/(?<!\\)"/g) || []).length % 2 !== 0) r += '"';
          r = r.replace(/,\s*$/, '');
          const o = (r.match(/[{[]/g) || []).length;
          const c = (r.match(/[\]}]/g) || []).length;
          for (let j = 0; j < o - c; j++) r += r.lastIndexOf('[') > r.lastIndexOf('{') ? ']' : '}';
          try { parsed = JSON.parse(r); } catch {
            const sm = clean.match(/"score"\s*:\s*(\d+)/);
            const su = clean.match(/"summary"\s*:\s*"([^"]*)/);
            const wr = clean.match(/"wouldReturn"\s*:\s*(true|false)/);
            parsed = { score: sm ? parseInt(sm[1]!) : 5, summary: su ? su[1]! : "Respuesta parcial.", steps: [], issues: [{ severity: "warning", description: "Respuesta truncada — datos parciales." }], wouldReturn: wr ? wr[1] === "true" : null };
          }
        }
        all.push({ ...parsed, personaId: p.id });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        all.push({ personaId: p.id, score: 0, summary: `Error: ${msg}`, steps: [], issues: [{ severity: "critical", description: msg }], wouldReturn: false });
      }
    }
    setResults(all); setLoading(false); setStep(3);
  }, [selectedPersonas, sourceType, flowInput, productContext]);

  const avgScore = results ? results.reduce((a, r) => a + (r.score || 0), 0) / results.length : 0;
  const avg = avgScore.toFixed(1);
  const issueCount = results ? results.reduce((a, r) => a + (r.issues?.length ?? 0), 0) : 0;
  const critCount = results ? results.reduce((a, r) => a + (r.issues?.filter(i => i.severity === "critical").length ?? 0), 0) : 0;
  const retainCount = results ? results.filter(r => r.wouldReturn).length : 0;

  return (
    <div style={{ minHeight: "100vh", background: T.beige25, fontFamily: T.font, color: T.black, padding: "40px 20px", WebkitFontSmoothing: "antialiased" }}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet" />
      <div style={{ maxWidth: "680px", margin: "0 auto" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "36px" }}>
          {/* Overlapping avatars */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "16px" }}>
            <div style={{ display: "flex", paddingRight: "24px" }}>
              {PRESET_PERSONAS.slice(0, 5).map((p, i) => (
                <div key={p.id} style={{ marginRight: "-24px", zIndex: 5 - i, borderRadius: "50%" }}>
                  <Avatar persona={p} size={60} border={`2px solid ${T.beige25}`} />
                </div>
              ))}
            </div>
          </div>
          <h1 style={{ margin: "0 0 8px", fontSize: "42px", fontWeight: 800, color: T.black, letterSpacing: "-0.56px" }}>Synthetic Users Lab</h1>
          <p style={{ margin: 0, fontSize: "16px", color: T.black }}>Simula usuarios reales testeando tus flujos.</p>
        </div>

        {/* Modal */}
        <Modal
          open={showModal}
          onClose={() => setShowModal(false)}
          title="Nuevo usuario sintético"
          description="Define el perfil para tus tests."
          footer={<>
            <BtnTertiary onClick={() => setShowModal(false)}>Cancelar</BtnTertiary>
            <BtnPrimary onClick={addCustom} disabled={!canAdd}>Crear usuario</BtnPrimary>
          </>}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <label style={labelStyle}>Nombre</label>
              <input value={customPersona.name} onChange={e => setCustomPersona(p => ({ ...p, name: e.target.value }))} placeholder="Ej: Carlos — Dueño de HomeService" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Descripción</label>
              <textarea value={customPersona.description} onChange={e => setCustomPersona(p => ({ ...p, description: e.target.value }))} placeholder="Describe quién es, cómo usa tecnología, qué espera..." rows={4} style={textareaStyle} />
            </div>
            <div>
              <label style={labelStyle}>Rasgos <span style={{ fontWeight: 400, color: T.textSecondary }}>(separados por coma)</span></label>
              <input value={customPersona.traits} onChange={e => setCustomPersona(p => ({ ...p, traits: e.target.value }))} placeholder="Impaciente, Bajo nivel digital, Espera ROI..." style={inputStyle} />
            </div>
          </div>
        </Modal>

        <ProgressBar steps={["Personas", "Flujo", "Test", "Resultados"]} current={step} />

        {/* Step 0 */}
        {step === 0 && <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <p style={{ margin: 0, fontSize: "14px", color: T.black }}>{selectedPersonas.length} perfil{selectedPersonas.length !== 1 && "es"} seleccionado{selectedPersonas.length !== 1 && "s"}</p>
            <BtnSecondary onClick={() => setShowModal(true)} style={{ gap: "6px", height: "36px", padding: "0 16px", fontSize: "14px" }}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
              Nuevo
            </BtnSecondary>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {PRESET_PERSONAS.map(p => <PersonaCard key={p.id} persona={p} selected={selectedPersonas.includes(p.id)} onToggle={toggle} />)}
          </div>
          <BtnPrimary onClick={() => setStep(1)} disabled={!selectedPersonas.length} block>Siguiente</BtnPrimary>
        </div>}

        {/* Step 1 */}
        {step === 1 && <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div>
            <label style={labelStyle}>Fuente</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "8px" }}>
              {SOURCE_TYPES.map(s => (
                <button key={s.id} onClick={() => setSourceType(s.id)} style={{
                  padding: "12px 8px", display: "flex", flexDirection: "column", alignItems: "center", gap: "6px",
                  fontSize: "14px", fontWeight: 600, fontFamily: T.font,
                  background: sourceType === s.id ? T.accent100 : T.white,
                  border: sourceType === s.id ? `2px solid ${T.accent300}` : `1px solid ${T.tertiaryBorder}`,
                  borderRadius: T.rLg, color: T.black,
                  cursor: "pointer", outline: "none", transition: "all 0.15s",
                }}>
                  <span style={{ fontSize: "20px" }}>{s.icon}</span>{s.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label style={labelStyle}>Descripción del flujo</label>
            <textarea value={flowInput} onChange={e => setFlowInput(e.target.value)} placeholder={SOURCE_TYPES.find(s => s.id === sourceType)?.placeholder} rows={7} style={textareaStyle} />
          </div>
          <div>
            <label style={labelStyle}>Contexto del producto <span style={{ fontWeight: 400, color: T.textSecondary }}>(opcional)</span></label>
            <textarea value={productContext} onChange={e => setProductContext(e.target.value)} placeholder="Qué es, para quién, qué problema resuelve..." rows={3} style={textareaStyle} />
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <BtnTertiary onClick={() => setStep(0)}>Atrás</BtnTertiary>
            <BtnPrimary onClick={() => { setStep(2); run(); }} disabled={!flowInput.trim()} block>Lanzar simulación</BtnPrimary>
          </div>
        </div>}

        {/* Step 2 */}
        {step === 2 && loading && <div style={{
          display: "flex", flexDirection: "column", alignItems: "center", gap: "24px",
          padding: "80px 20px", background: T.white, borderRadius: T.rXl,
          border: `1px solid ${T.tertiaryBorder}`, boxShadow: T.shadowSm,
        }}>
          <style>{`@keyframes pSpin{to{transform:rotate(360deg)}}`}</style>
          <div style={{ width: "36px", height: "36px", borderRadius: "50%", border: `3px solid ${T.greySoft}`, borderTopColor: T.primary, animation: "pSpin 0.8s linear infinite" }} />
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "18px", fontWeight: 600, color: T.black }}>{progress.currentPersona}</div>
            <div style={{ fontSize: "14px", color: T.textSecondary, marginTop: "4px" }}>Usuario {progress.current} de {progress.total}</div>
          </div>
          <div style={{ width: "180px", height: "6px", background: T.greySoft, borderRadius: "3px", overflow: "hidden" }}>
            <div style={{ height: "100%", background: T.accent300, borderRadius: "3px", width: `${(progress.current / progress.total) * 100}%`, transition: "width 0.4s" }} />
          </div>
        </div>}

        {/* Step 3 */}
        {step === 3 && results && <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "10px" }}>
            {([
              { l: "Score medio", v: avg, variant: (avgScore >= 7 ? "success" : avgScore >= 4 ? "warning" : "error") as BadgeVariant },
              { l: "Issues", v: issueCount, variant: "warning" as BadgeVariant },
              { l: "Críticos", v: critCount, variant: "error" as BadgeVariant },
              { l: "Retención", v: `${retainCount}/${results.length}`, variant: "success" as BadgeVariant },
            ]).map((m, i) => (
              <div key={i} style={{ padding: "16px 12px", background: T.white, border: `1px solid ${T.tertiaryBorder}`, borderRadius: T.rLg, textAlign: "center", boxShadow: T.shadowSm }}>
                <div style={{ fontSize: "24px", fontWeight: 800, color: T.black, marginBottom: "4px" }}>{m.v}</div>
                <Badge variant={m.variant} dot>{m.l}</Badge>
              </div>
            ))}
          </div>
          <div style={{ fontSize: "16px", fontWeight: 700, color: T.black }}>Resultados por usuario</div>
          {results.map((r, i) => <ResultCard key={i} result={r} index={i} />)}
          <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
            <BtnTertiary onClick={() => { setStep(1); setResults(null); }}>Editar flujo</BtnTertiary>
            <BtnSecondary onClick={() => { setStep(0); setResults(null); }} block>Nuevo test</BtnSecondary>
          </div>
        </div>}
      </div>
    </div>
  );
}
