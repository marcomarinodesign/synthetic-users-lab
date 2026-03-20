import { useState, useCallback, useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import type { Persona, SimulationResult, SourceType } from "@/types";
import { PRESET_PERSONAS } from "@/lib/personas";
import { simulatePersona, fetchUrlContent } from "@/lib/simulation";

/* ─── Types ─── */
type IssueSeverity = "critical" | "warning" | "info";
type IssueCategory = "ux" | "ui" | "product" | "copy";
type BadgeVariant = "default" | "success" | "warning" | "error" | "info";

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

/* ─── i18n ─── */
type Lang = "es" | "en" | "fr" | "pt" | "de";

const LANG_OPTIONS: { code: Lang; label: string }[] = [
  { code: "es", label: "🇪🇸 ES" },
  { code: "en", label: "🇬🇧 EN" },
  { code: "fr", label: "🇫🇷 FR" },
  { code: "pt", label: "🇧🇷 PT" },
  { code: "de", label: "🇩🇪 DE" },
];

function detectLang(): Lang {
  const code = (typeof navigator !== "undefined" ? navigator.language : "es").split("-")[0].toLowerCase();
  return (["es", "en", "fr", "pt", "de"] as Lang[]).includes(code as Lang) ? (code as Lang) : "es";
}

interface Translations {
  subtitle: string;
  steps: [string, string, string, string];
  profilesSelected: (n: number) => string;
  newBtn: string; nextBtn: string; backBtn: string; cancelBtn: string; createBtn: string;
  linkLabel: string; linkPlaceholder: string;
  contextLabel: string; contextOptional: string; contextPlaceholder: string;
  languageLabel: string;
  launchBtn: string;
  fetchingPhase: string; analyzingPhase: string;
  userOf: (c: number, t: number) => string;
  scoreLabel: string; issuesLabel: string; criticalLabel: string; retentionLabel: string;
  resultsByUser: string; newTestBtn: string; editFlowBtn: string;
  modalTitle: string; modalDesc: string;
  nameLabel: string; namePlaceholder: string;
  descLabel: string; descPlaceholder: string;
  traitsLabel: string; traitsSuffix: string; traitsPlaceholder: string;
  wouldReturn: string; wouldNotReturn: string;
  wouldReturnShort: string; wouldNotReturnShort: string;
  summaryLabel: string; stepsLabel: string; issuesSectionLabel: string;
  sevLabels: { critical: string; warning: string; info: string };
}

const TRANSLATIONS: Record<Lang, Translations> = {
  es: {
    subtitle: "Simula usuarios reales testeando tus flujos.",
    steps: ["Personas", "Flujo", "Test", "Resultados"],
    profilesSelected: (n) => `${n} perfil${n !== 1 ? "es" : ""} seleccionado${n !== 1 ? "s" : ""}`,
    newBtn: "Nuevo", nextBtn: "Siguiente", backBtn: "Atrás", cancelBtn: "Cancelar", createBtn: "Crear usuario",
    linkLabel: "Link (web o repo)", linkPlaceholder: "https://tu-web.com o https://github.com/user/repo",
    contextLabel: "Contexto del producto", contextOptional: "(opcional)", contextPlaceholder: "Qué es, para quién, qué problema resuelve...",
    languageLabel: "Idioma",
    launchBtn: "Lanzar simulación",
    fetchingPhase: "Leyendo contenido de las URLs...", analyzingPhase: "Analizando con Gemini...",
    userOf: (c, t) => `Usuario ${c} de ${t}`,
    scoreLabel: "Score medio", issuesLabel: "Issues", criticalLabel: "Críticos", retentionLabel: "Retención",
    resultsByUser: "Resultados por usuario", newTestBtn: "Nuevo test", editFlowBtn: "Editar flujo",
    modalTitle: "Nuevo usuario sintético", modalDesc: "Define el perfil para tus tests.",
    nameLabel: "Nombre", namePlaceholder: "Ej: Carlos — Dueño de HomeService",
    descLabel: "Descripción", descPlaceholder: "Describe quién es, cómo usa tecnología, qué espera...",
    traitsLabel: "Rasgos", traitsSuffix: "(separados por coma)", traitsPlaceholder: "Impaciente, Bajo nivel digital, Espera ROI...",
    wouldReturn: "Volvería a usar el producto", wouldNotReturn: "No volvería a usar el producto",
    wouldReturnShort: "Volvería", wouldNotReturnShort: "No volvería",
    summaryLabel: "Resumen", stepsLabel: "Recorrido", issuesSectionLabel: "Issues",
    sevLabels: { critical: "Crítico", warning: "Aviso", info: "Info" },
  },
  en: {
    subtitle: "Simulate real users testing your flows.",
    steps: ["Personas", "Flow", "Test", "Results"],
    profilesSelected: (n) => `${n} profile${n !== 1 ? "s" : ""} selected`,
    newBtn: "New", nextBtn: "Next", backBtn: "Back", cancelBtn: "Cancel", createBtn: "Create user",
    linkLabel: "Link (web or repo)", linkPlaceholder: "https://your-site.com or https://github.com/user/repo",
    contextLabel: "Product context", contextOptional: "(optional)", contextPlaceholder: "What it is, who it's for, what problem it solves...",
    languageLabel: "Language",
    launchBtn: "Launch simulation",
    fetchingPhase: "Reading URL content...", analyzingPhase: "Analyzing with Gemini...",
    userOf: (c, t) => `User ${c} of ${t}`,
    scoreLabel: "Avg score", issuesLabel: "Issues", criticalLabel: "Critical", retentionLabel: "Retention",
    resultsByUser: "Results by user", newTestBtn: "New test", editFlowBtn: "Edit flow",
    modalTitle: "New synthetic user", modalDesc: "Define the profile for your tests.",
    nameLabel: "Name", namePlaceholder: "E.g: Carlos — HomeService owner",
    descLabel: "Description", descPlaceholder: "Describe who they are, how they use tech, what they expect...",
    traitsLabel: "Traits", traitsSuffix: "(comma-separated)", traitsPlaceholder: "Impatient, Low digital literacy, Expects ROI...",
    wouldReturn: "Would use the product again", wouldNotReturn: "Would not use the product again",
    wouldReturnShort: "Would return", wouldNotReturnShort: "Would not return",
    summaryLabel: "Summary", stepsLabel: "Journey", issuesSectionLabel: "Issues",
    sevLabels: { critical: "Critical", warning: "Warning", info: "Info" },
  },
  fr: {
    subtitle: "Simulez de vrais utilisateurs testant vos flux.",
    steps: ["Personas", "Flux", "Test", "Résultats"],
    profilesSelected: (n) => `${n} profil${n !== 1 ? "s" : ""} sélectionné${n !== 1 ? "s" : ""}`,
    newBtn: "Nouveau", nextBtn: "Suivant", backBtn: "Retour", cancelBtn: "Annuler", createBtn: "Créer l'utilisateur",
    linkLabel: "Lien (web ou repo)", linkPlaceholder: "https://votre-site.com ou https://github.com/user/repo",
    contextLabel: "Contexte produit", contextOptional: "(optionnel)", contextPlaceholder: "Ce que c'est, pour qui, quel problème ça résout...",
    languageLabel: "Langue",
    launchBtn: "Lancer la simulation",
    fetchingPhase: "Lecture du contenu des URLs...", analyzingPhase: "Analyse avec Gemini...",
    userOf: (c, t) => `Utilisateur ${c} sur ${t}`,
    scoreLabel: "Score moyen", issuesLabel: "Problèmes", criticalLabel: "Critiques", retentionLabel: "Rétention",
    resultsByUser: "Résultats par utilisateur", newTestBtn: "Nouveau test", editFlowBtn: "Modifier le flux",
    modalTitle: "Nouvel utilisateur synthétique", modalDesc: "Définissez le profil pour vos tests.",
    nameLabel: "Nom", namePlaceholder: "Ex: Carlos — Propriétaire de HomeService",
    descLabel: "Description", descPlaceholder: "Décrivez qui il est, comment il utilise la tech, ce qu'il attend...",
    traitsLabel: "Traits", traitsSuffix: "(séparés par virgule)", traitsPlaceholder: "Impatient, Faible niveau numérique, Attend un ROI...",
    wouldReturn: "Reviendrait utiliser le produit", wouldNotReturn: "Ne reviendrait pas utiliser le produit",
    wouldReturnShort: "Reviendrait", wouldNotReturnShort: "Ne reviendrait pas",
    summaryLabel: "Résumé", stepsLabel: "Parcours", issuesSectionLabel: "Problèmes",
    sevLabels: { critical: "Critique", warning: "Avertissement", info: "Info" },
  },
  pt: {
    subtitle: "Simule usuários reais testando seus fluxos.",
    steps: ["Personas", "Fluxo", "Teste", "Resultados"],
    profilesSelected: (n) => `${n} perfil${n !== 1 ? "is" : ""} selecionado${n !== 1 ? "s" : ""}`,
    newBtn: "Novo", nextBtn: "Próximo", backBtn: "Voltar", cancelBtn: "Cancelar", createBtn: "Criar usuário",
    linkLabel: "Link (web ou repo)", linkPlaceholder: "https://seu-site.com ou https://github.com/user/repo",
    contextLabel: "Contexto do produto", contextOptional: "(opcional)", contextPlaceholder: "O que é, para quem, qual problema resolve...",
    languageLabel: "Idioma",
    launchBtn: "Lançar simulação",
    fetchingPhase: "Lendo conteúdo das URLs...", analyzingPhase: "Analisando com Gemini...",
    userOf: (c, t) => `Usuário ${c} de ${t}`,
    scoreLabel: "Score médio", issuesLabel: "Issues", criticalLabel: "Críticos", retentionLabel: "Retenção",
    resultsByUser: "Resultados por usuário", newTestBtn: "Novo teste", editFlowBtn: "Editar fluxo",
    modalTitle: "Novo usuário sintético", modalDesc: "Defina o perfil para seus testes.",
    nameLabel: "Nome", namePlaceholder: "Ex: Carlos — Dono do HomeService",
    descLabel: "Descrição", descPlaceholder: "Descreva quem é, como usa tecnologia, o que espera...",
    traitsLabel: "Características", traitsSuffix: "(separadas por vírgula)", traitsPlaceholder: "Impaciente, Baixo nível digital, Espera ROI...",
    wouldReturn: "Voltaria a usar o produto", wouldNotReturn: "Não voltaria a usar o produto",
    wouldReturnShort: "Voltaria", wouldNotReturnShort: "Não voltaria",
    summaryLabel: "Resumo", stepsLabel: "Percurso", issuesSectionLabel: "Issues",
    sevLabels: { critical: "Crítico", warning: "Aviso", info: "Info" },
  },
  de: {
    subtitle: "Simulieren Sie echte Nutzer beim Testen Ihrer Flows.",
    steps: ["Personas", "Flow", "Test", "Ergebnisse"],
    profilesSelected: (n) => `${n} Profil${n !== 1 ? "e" : ""} ausgewählt`,
    newBtn: "Neu", nextBtn: "Weiter", backBtn: "Zurück", cancelBtn: "Abbrechen", createBtn: "Nutzer erstellen",
    linkLabel: "Link (Web oder Repo)", linkPlaceholder: "https://ihre-seite.com oder https://github.com/user/repo",
    contextLabel: "Produktkontext", contextOptional: "(optional)", contextPlaceholder: "Was es ist, für wen, welches Problem es löst...",
    languageLabel: "Sprache",
    launchBtn: "Simulation starten",
    fetchingPhase: "URL-Inhalt wird gelesen...", analyzingPhase: "Analyse mit Gemini...",
    userOf: (c, t) => `Nutzer ${c} von ${t}`,
    scoreLabel: "Ø Score", issuesLabel: "Probleme", criticalLabel: "Kritisch", retentionLabel: "Bindung",
    resultsByUser: "Ergebnisse nach Nutzer", newTestBtn: "Neuer Test", editFlowBtn: "Flow bearbeiten",
    modalTitle: "Neuer synthetischer Nutzer", modalDesc: "Definieren Sie das Profil für Ihre Tests.",
    nameLabel: "Name", namePlaceholder: "z.B.: Carlos — HomeService-Inhaber",
    descLabel: "Beschreibung", descPlaceholder: "Beschreiben Sie, wer er ist, wie er Tech nutzt, was er erwartet...",
    traitsLabel: "Eigenschaften", traitsSuffix: "(kommagetrennt)", traitsPlaceholder: "Ungeduldig, Geringes digitales Niveau, Erwartet ROI...",
    wouldReturn: "Würde das Produkt wieder nutzen", wouldNotReturn: "Würde das Produkt nicht wieder nutzen",
    wouldReturnShort: "Würde zurückkommen", wouldNotReturnShort: "Würde nicht zurückkommen",
    summaryLabel: "Zusammenfassung", stepsLabel: "Verlauf", issuesSectionLabel: "Probleme",
    sevLabels: { critical: "Kritisch", warning: "Warnung", info: "Info" },
  },
};

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
      border: `2px solid ${selected ? T.black : T.tertiaryBorder}`,
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
  t: Translations;
  issueCategoryFilter: "all" | IssueCategory;
}

function ResultCard({ result, index, t, issueCategoryFilter }: ResultCardProps) {
  const [open, setOpen] = useState(index === 0);
  const persona: AvatarPersona = PRESET_PERSONAS.find(p => p.id === result.personaId) ?? { name: "Custom", initials: "CU", avatarBg: T.accent100, avatarColor: T.accent700 };
  const sc = result.score || 0;
  const scoreVariant: BadgeVariant = sc >= 7 ? "success" : sc >= 4 ? "warning" : "error";
  const sevMap: Record<IssueSeverity, BadgeVariant> = { critical: "error", warning: "warning", info: "info" };
  const catLabelMap: Record<IssueCategory, string> = { ux: "UX", ui: "UI", product: "Product", copy: "Copy" };
  const catVariantMap: Record<IssueCategory, BadgeVariant> = { ux: "info", ui: "success", product: "warning", copy: "default" };
  const issuesToShow = issueCategoryFilter === "all" ? result.issues : result.issues.filter(i => i.category === issueCategoryFilter);

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
            {result.issues?.length || 0} issues · {result.wouldReturn ? t.wouldReturnShort : t.wouldNotReturnShort}
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
            <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: T.textSecondary, marginBottom: "8px" }}>{t.summaryLabel}</div>
            <p style={{ margin: 0, fontSize: "14px", lineHeight: 1.6, color: T.black }}>{result.summary}</p>
          </div>}

          {result.steps?.length > 0 && <div>
            <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: T.textSecondary, marginBottom: "8px" }}>{t.stepsLabel}</div>
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
            <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: T.textSecondary, marginBottom: "8px" }}>{t.issuesSectionLabel}</div>
            {issuesToShow.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {issuesToShow.map((issue, ii) => (
                  <div key={ii} style={{ display: "flex", gap: "10px", alignItems: "flex-start", padding: "10px 14px" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", minWidth: "170px" }}>
                      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
                        <Badge variant={sevMap[issue.severity]} dot>{t.sevLabels[issue.severity]}</Badge>
                        <Badge variant={catVariantMap[issue.category]}>{catLabelMap[issue.category]}</Badge>
                      </div>
                      {issue.component ? (
                        <span style={{
                          display: "inline-flex",
                          maxWidth: "100%",
                          padding: "4px 10px",
                          fontSize: "12px",
                          fontWeight: 700,
                          borderRadius: T.rFull,
                          background: T.beige50,
                          color: T.black,
                          lineHeight: "16px",
                          border: `1px solid ${T.greySoftMiddle}`,
                          wordBreak: "break-word",
                        }}>{issue.component}</span>
                      ) : null}
                    </div>
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
                      <span style={{ fontSize: "14px", color: T.black, lineHeight: 1.45 }}>{issue.description}</span>
                      {issue.action ? (
                        <div style={{ fontSize: "14px", color: T.textSecondary, lineHeight: 1.45 }}>
                          <span style={{ fontWeight: 800, color: T.primary, marginRight: "6px" }}>→</span>
                          {issue.action}
                        </div>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: "10px 14px", fontSize: "14px", color: T.textSecondary, lineHeight: 1.45 }}>
                No hay issues en esta categoría.
              </div>
            )}
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
              {result.wouldReturn ? t.wouldReturn : t.wouldNotReturn}
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
  const [selectedPersonas, setSelectedPersonas] = useState<string[]>([]);
  const [customPersona, setCustomPersona] = useState({ name: "", description: "", traits: "" });
  const [flowInput, setFlowInput] = useState("");
  const [productContext, setProductContext] = useState("");
  const [results, setResults] = useState<SimulationResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingPhase, setLoadingPhase] = useState<"fetching" | "analyzing">("fetching");
  const [progress, setProgress] = useState({ current: 0, total: 0, currentPersona: "" });
  const [showModal, setShowModal] = useState(false);
  const [language, setLanguage] = useState<Lang>(detectLang);
  const [issueCategoryFilter, setIssueCategoryFilter] = useState<"all" | IssueCategory>("all");
  const t = TRANSLATIONS[language];

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
    setIssueCategoryFilter("all");
    const personas = PRESET_PERSONAS.filter(p => selectedPersonas.includes(p.id));
    const sourceType: SourceType = flowInput.toLowerCase().includes("github.com") ? "repo" : "url";

    // Phase 1: fetch URL content
    setLoadingPhase("fetching");
    let contentToAnalyze = flowInput;
    if (flowInput.trim().startsWith("http")) {
      try {
        contentToAnalyze = await fetchUrlContent(flowInput.trim());
      } catch {
        contentToAnalyze = flowInput;
      }
    }

    // Phase 2: analyze with Gemini
    setLoadingPhase("analyzing");
    setProgress({ current: 0, total: personas.length, currentPersona: "" });
    const all: SimulationResult[] = [];
    for (let i = 0; i < personas.length; i++) {
      const p = personas[i];
      setProgress({ current: i + 1, total: personas.length, currentPersona: p.name });
      try {
        const result = await simulatePersona(p, sourceType, contentToAnalyze, productContext, language);
        all.push(result);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        all.push({
          personaId: p.id,
          score: 0,
          summary: `Error: ${msg}`,
          steps: [],
          issues: [
            {
              severity: "critical",
              description: msg,
              action: "Reintentar la simulación y asegurar que el backend devuelva un JSON válido.",
              component: "API de simulación",
              category: "ux",
            },
          ],
          wouldReturn: false,
        });
      }
    }
    setResults(all); setLoading(false); setStep(3);
  }, [selectedPersonas, flowInput, productContext]);

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
          <p style={{ margin: "0 0 16px", fontSize: "16px", color: T.black }}>{t.subtitle}</p>
          <div style={{ display: "flex", gap: "6px", justifyContent: "center", flexWrap: "wrap" }}>
            {LANG_OPTIONS.map(({ code, label }) => (
              <button key={code} onClick={() => setLanguage(code)} style={{
                padding: "5px 12px", borderRadius: T.rFull,
                border: `1.5px solid ${language === code ? T.primary : T.greySoft}`,
                background: language === code ? T.primary : T.white,
                color: language === code ? T.primaryText : T.black,
                fontSize: "12px", fontWeight: language === code ? 600 : 400,
                cursor: "pointer", fontFamily: T.font, transition: "all 0.15s",
              }}>{label}</button>
            ))}
          </div>
        </div>

        {/* Modal */}
        <Modal
          open={showModal}
          onClose={() => setShowModal(false)}
          title={t.modalTitle}
          description={t.modalDesc}
          footer={<>
            <BtnTertiary onClick={() => setShowModal(false)}>{t.cancelBtn}</BtnTertiary>
            <BtnPrimary onClick={addCustom} disabled={!canAdd}>{t.createBtn}</BtnPrimary>
          </>}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <label style={labelStyle}>{t.nameLabel}</label>
              <input value={customPersona.name} onChange={e => setCustomPersona(p => ({ ...p, name: e.target.value }))} placeholder={t.namePlaceholder} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>{t.descLabel}</label>
              <textarea value={customPersona.description} onChange={e => setCustomPersona(p => ({ ...p, description: e.target.value }))} placeholder={t.descPlaceholder} rows={4} style={textareaStyle} />
            </div>
            <div>
              <label style={labelStyle}>{t.traitsLabel} <span style={{ fontWeight: 400, color: T.textSecondary }}>{t.traitsSuffix}</span></label>
              <input value={customPersona.traits} onChange={e => setCustomPersona(p => ({ ...p, traits: e.target.value }))} placeholder={t.traitsPlaceholder} style={inputStyle} />
            </div>
          </div>
        </Modal>

        <ProgressBar steps={t.steps} current={step} />

        {/* Step 0 */}
        {step === 0 && <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <p style={{ margin: 0, fontSize: "14px", color: T.black }}>{t.profilesSelected(selectedPersonas.length)}</p>
            <BtnSecondary onClick={() => setShowModal(true)} style={{ gap: "6px", height: "36px", padding: "0 16px", fontSize: "14px" }}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
              {t.newBtn}
            </BtnSecondary>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {PRESET_PERSONAS.map(p => <PersonaCard key={p.id} persona={p} selected={selectedPersonas.includes(p.id)} onToggle={toggle} />)}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", alignSelf: "center", alignItems: "stretch" }}>
            <BtnPrimary onClick={() => setStep(1)} disabled={!selectedPersonas.length}>{t.nextBtn}</BtnPrimary>
          </div>
        </div>}

        {/* Step 1 */}
        {step === 1 && <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div>
            <label style={labelStyle}>{t.linkLabel}</label>
            <input value={flowInput} onChange={e => setFlowInput(e.target.value)} placeholder={t.linkPlaceholder} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>{t.contextLabel} <span style={{ fontWeight: 400, color: T.textSecondary }}>{t.contextOptional}</span></label>
            <textarea value={productContext} onChange={e => setProductContext(e.target.value)} placeholder={t.contextPlaceholder} rows={7} style={textareaStyle} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", alignSelf: "center", alignItems: "stretch" }}>
            <BtnPrimary onClick={() => { setStep(2); run(); }} disabled={!flowInput.trim()}>{t.launchBtn}</BtnPrimary>
            <BtnTertiary onClick={() => setStep(0)}>{t.backBtn}</BtnTertiary>
          </div>
        </div>}

        {/* Step 2 */}
        {step === 2 && loading && <div style={{
          display: "flex", flexDirection: "column", alignItems: "center", gap: "28px",
          padding: "60px 20px", background: T.white, borderRadius: T.rXl,
          border: `1px solid ${T.tertiaryBorder}`, boxShadow: T.shadowSm,
        }}>
          <style>{`@keyframes pSpin{to{transform:rotate(360deg)}}`}</style>
          {/* Two-phase indicator */}
          <div style={{ display: "flex", flexDirection: "column", gap: "14px", width: "260px" }}>
            {/* Phase 1 */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              {loadingPhase === "fetching" ? (
                <div style={{ flexShrink: 0, width: "20px", height: "20px", borderRadius: "50%", border: `2px solid ${T.greySoft}`, borderTopColor: T.primary, animation: "pSpin 0.8s linear infinite" }} />
              ) : (
                <div style={{ flexShrink: 0, width: "20px", height: "20px", borderRadius: "50%", background: T.accent500, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="11" height="8" viewBox="0 0 11 8" fill="none"><path d="M1 4L4 7L10 1" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
              )}
              <span style={{ fontSize: "14px", fontWeight: loadingPhase === "fetching" ? 600 : 400, color: loadingPhase === "fetching" ? T.black : T.greyDark, textDecoration: loadingPhase === "fetching" ? "none" : "line-through" }}>
                {t.fetchingPhase}
              </span>
            </div>
            {/* Phase 2 */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              {loadingPhase === "analyzing" ? (
                <div style={{ flexShrink: 0, width: "20px", height: "20px", borderRadius: "50%", border: `2px solid ${T.greySoft}`, borderTopColor: T.primary, animation: "pSpin 0.8s linear infinite" }} />
              ) : (
                <div style={{ flexShrink: 0, width: "20px", height: "20px", borderRadius: "50%", border: `2px solid ${T.greySoft}` }} />
              )}
              <span style={{ fontSize: "14px", fontWeight: loadingPhase === "analyzing" ? 600 : 400, color: loadingPhase === "analyzing" ? T.black : T.greyDark }}>
                {t.analyzingPhase}
              </span>
            </div>
          </div>
          {/* Persona progress (only visible during analyzing phase) */}
          {loadingPhase === "analyzing" && progress.total > 0 && <>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "16px", fontWeight: 600, color: T.black }}>{progress.currentPersona}</div>
              <div style={{ fontSize: "13px", color: T.textSecondary, marginTop: "4px" }}>{t.userOf(progress.current, progress.total)}</div>
            </div>
            <div style={{ width: "180px", height: "6px", background: T.greySoft, borderRadius: "3px", overflow: "hidden" }}>
              <div style={{ height: "100%", background: T.accent300, borderRadius: "3px", width: `${(progress.current / progress.total) * 100}%`, transition: "width 0.4s" }} />
            </div>
          </>}
        </div>}

        {/* Step 3 */}
        {step === 3 && results && <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "10px" }}>
            {([
              { l: t.scoreLabel, v: avg, variant: (avgScore >= 7 ? "success" : avgScore >= 4 ? "warning" : "error") as BadgeVariant },
              { l: t.issuesLabel, v: issueCount, variant: "warning" as BadgeVariant },
              { l: t.criticalLabel, v: critCount, variant: "error" as BadgeVariant },
              { l: t.retentionLabel, v: `${retainCount}/${results.length}`, variant: "success" as BadgeVariant },
            ]).map((m, i) => (
              <div key={i} style={{ padding: "16px 12px", background: T.white, border: `1px solid ${T.tertiaryBorder}`, borderRadius: T.rLg, textAlign: "center", boxShadow: T.shadowSm }}>
                <div style={{ fontSize: "24px", fontWeight: 800, color: T.black, marginBottom: "4px" }}>{m.v}</div>
                <Badge variant={m.variant} dot>{m.l}</Badge>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
            <div style={{ fontSize: "16px", fontWeight: 700, color: T.black }}>{t.resultsByUser}</div>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {([
                { id: "all", label: "All" },
                { id: "ux", label: "UX" },
                { id: "ui", label: "UI" },
                { id: "product", label: "Product" },
                { id: "copy", label: "Copy" },
              ] as { id: "all" | IssueCategory; label: string }[]).map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => setIssueCategoryFilter(id)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: T.rFull,
                    border: `1.5px solid ${issueCategoryFilter === id ? T.primary : T.greySoft}`,
                    background: issueCategoryFilter === id ? T.primary : T.white,
                    color: issueCategoryFilter === id ? T.primaryText : T.black,
                    fontSize: "12px",
                    fontWeight: issueCategoryFilter === id ? 600 : 400,
                    cursor: "pointer",
                    fontFamily: T.font,
                    transition: "all 0.15s",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          {results.map((r, i) => <ResultCard key={i} result={r} index={i} t={t} issueCategoryFilter={issueCategoryFilter} />)}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", alignSelf: "center", alignItems: "stretch", marginTop: "8px" }}>
            <BtnPrimary onClick={() => { setStep(0); setResults(null); }}>{t.newTestBtn}</BtnPrimary>
            <BtnSecondary onClick={() => { setStep(1); setResults(null); }}>{t.editFlowBtn}</BtnSecondary>
          </div>
        </div>}
      </div>
    </div>
  );
}
