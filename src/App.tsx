import { useState, useCallback, useEffect, useRef, type CSSProperties } from "react";
import type { Persona, SimulationResult, SourceType } from "@/types";
import { PRESET_PERSONAS } from "@/lib/personas";
import { simulatePersona, fetchUrlContent } from "@/lib/simulation";

import { Button as ShadButton } from "@/components/ui/button";
import { Badge as ShadBadge } from "@/components/ui/badge";
import { Card as ShadCard } from "@/components/ui/card";
import { Progress as ShadProgress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input as ShadInput } from "@/components/ui/input";
import { Label as ShadLabel } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea as ShadTextarea } from "@/components/ui/textarea";

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

/* ─── DS Components ─── */

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
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <div style={{ fontSize: "15px", fontWeight: 700, color: T.black, lineHeight: "18px" }}>{persona.name}</div>
            {persona.category === "pro" && (
              <ShadBadge
                className="bg-[var(--color-basics-black)] text-[var(--color-basics-white)] hover:bg-[var(--color-basics-black)] border-[var(--color-basics-black)]"
              >
                PRO
              </ShadBadge>
            )}
          </div>
          <p style={{ margin: 0, fontSize: "13px", lineHeight: "19.5px", color: T.black }}>{persona.description}</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {persona.traits.map(t => (
              <ShadBadge
                key={t}
                variant="outline"
                className={
                  selected
                    ? "bg-[var(--color-accent-200)] text-[var(--color-basics-black)] border-[var(--color-accent-200)]"
                    : "bg-[var(--color-beige-50)] text-[var(--color-basics-black)] border-[var(--color-tertiary-border)]"
                }
              >
                {t}
              </ShadBadge>
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
      <div style={{ marginBottom: "14px" }}>
        <ShadProgress value={pct} className="w-full flex-nowrap gap-0" />
      </div>
      <div className="flex justify-between">
        {steps.map((s, i) => (
          <div key={i} className="flex items-center gap-[6px]">
            <div style={{
              width: i === current ? "10px" : "8px",
              height: i === current ? "10px" : "8px",
              borderRadius: "9999px",
              background: i <= current ? "var(--color-primary)" : "var(--color-grey-middle)",
              border: i === current ? "2px solid rgba(0,0,0,0.2)" : "none",
              transition: "all 0.3s", flexShrink: 0,
            }} />
            <span
              className="text-[13px] transition-all"
              style={{
                fontWeight: i <= current ? 700 : 400,
                color: i <= current ? "var(--color-basics-black)" : "var(--color-grey-dark)",
              }}
            >
              {s}
            </span>
          </div>
        ))}
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
  const [currentStep, setCurrentStep] = useState(0);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const persona: AvatarPersona = PRESET_PERSONAS.find(p => p.id === result.personaId) ?? { name: "Custom", initials: "CU", avatarBg: T.accent100, avatarColor: T.accent700 };
  const sc = result.score || 0;
  const fit = result.fit_score || 0;
  const scoreVariant: BadgeVariant = sc >= 7 ? "success" : sc >= 4 ? "warning" : "error";
  const fitVariant: BadgeVariant = fit >= 7 ? "success" : fit >= 4 ? "warning" : "error";
  const scoreBadgeClass =
    scoreVariant === "success"
      ? "bg-[var(--color-accent-100)] text-[var(--color-accent-700)] border-[var(--color-accent-300)]"
      : scoreVariant === "warning"
        ? "bg-[var(--color-warning-2)] text-[var(--color-warning-1)] border-[var(--color-warning-1)]"
        : "bg-[var(--color-error-3)] text-[var(--color-error-1)] border-[var(--color-error-2)]";
  const fitBadgeClass =
    fitVariant === "success"
      ? "bg-[var(--color-accent-100)] text-[var(--color-accent-700)] border-[var(--color-accent-300)]"
      : fitVariant === "warning"
        ? "bg-[var(--color-warning-2)] text-[var(--color-warning-1)] border-[var(--color-warning-1)]"
        : "bg-[var(--color-error-3)] text-[var(--color-error-1)] border-[var(--color-error-2)]";
  const issueSeverityBadgeClass =
    (sev: IssueSeverity) =>
      sev === "critical"
        ? "bg-[var(--color-error-3)] text-[var(--color-error-1)] border-[var(--color-error-2)]"
        : sev === "warning"
          ? "bg-[var(--color-warning-2)] text-[var(--color-warning-1)] border-[var(--color-warning-1)]"
          : "bg-[var(--color-info-2)] text-[var(--color-info-1)] border-[var(--color-info-1)]";
  const issueCategoryBadgeClass = "bg-[var(--color-beige-50)] text-[var(--color-basics-black)] border-[var(--color-tertiary-border)]";
  const catLabelMap: Record<IssueCategory, string> = { ux: "UX", ui: "UI", product: "Product", copy: "Copy" };
  const issuesToShow = issueCategoryFilter === "all" ? result.issues : result.issues.filter(i => i.category === issueCategoryFilter);

  useEffect(() => {
    if (!open) return;
    setCurrentStep(0);
  }, [open, result.personaId]);

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
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <ShadBadge variant="outline" className={scoreBadgeClass}>
            UX {sc}/10
          </ShadBadge>
          <ShadBadge variant="outline" className={fitBadgeClass}>
            Fit {fit}/10
          </ShadBadge>
        </div>
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
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginTop: "10px" }}>
              <ShadBadge variant="outline" className={fitBadgeClass}>
                Fit {fit}/10
              </ShadBadge>
              {result.fit_note ? <span style={{ fontSize: "13px", color: T.textSecondary, lineHeight: 1.4 }}>{result.fit_note}</span> : null}
            </div>
          </div>}

          {result.steps?.length > 0 && <div>
            <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: T.textSecondary, marginBottom: "8px" }}>{t.stepsLabel}</div>
            <div>
              {/*
                Carousel horizontal:
                - Flechas laterales + dots
                - Swipe en móvil (touch)
                - Transición suave con translateX
              */}
              <div
                style={{
                  borderRadius: T.rMd,
                  overflow: "hidden",
                  border: `1px solid ${T.tertiaryBorder}`,
                  position: "relative",
                  background: T.white,
                }}
              >
                <div
                  style={{ overflow: "hidden" }}
                  onTouchStart={(e) => {
                    const t0 = e.touches[0];
                    if (!t0) return;
                    touchStartRef.current = { x: t0.clientX, y: t0.clientY };
                  }}
                  onTouchEnd={(e) => {
                    const start = touchStartRef.current;
                    if (!start) return;
                    const t0 = e.changedTouches[0];
                    if (!t0) return;
                    const dx = t0.clientX - start.x;
                    const dy = t0.clientY - start.y;
                    touchStartRef.current = null;

                    if (Math.abs(dx) < 45 || Math.abs(dx) < Math.abs(dy)) return;
                    const total = result.steps.length;
                    if (dx < 0) setCurrentStep((s) => Math.min(total - 1, s + 1));
                    else setCurrentStep((s) => Math.max(0, s - 1));
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      transform: `translateX(-${currentStep * 100}%)`,
                      transition: "transform 0.3s ease",
                    }}
                  >
                    {result.steps.map((s, si) => (
                      <div
                        key={si}
                        style={{
                          flex: "0 0 100%",
                          padding: "20px",
                          minHeight: "200px",
                          boxSizing: "border-box",
                          position: "relative",
                        }}
                      >
                        <div
                          style={{
                            position: "absolute",
                            top: "12px",
                            right: "14px",
                            fontSize: "12px",
                            fontWeight: 700,
                            color: T.greyDark,
                          }}
                        >
                          Paso {si + 1} de {result.steps.length}
                        </div>

                        <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                          <ShadBadge
                            variant="outline"
                            className="bg-[var(--color-accent-100)] text-[var(--color-accent-700)] border-[var(--color-accent-300)]"
                          >
                            {si + 1}
                          </ShadBadge>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: "15px", fontWeight: 800, color: T.black, lineHeight: "20px" }}>
                              {s.action}
                            </div>
                            <div style={{ fontSize: "14px", color: T.textSecondary, marginTop: "6px", lineHeight: 1.5 }}>
                              {s.reaction}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <ShadButton
                  aria-label="Paso anterior"
                  onClick={() => setCurrentStep((s) => Math.max(0, s - 1))}
                  disabled={currentStep === 0}
                  variant="ghost"
                  className="p-0"
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: "10px",
                    transform: "translateY(-50%)",
                    width: "36px",
                    height: "36px",
                    borderRadius: T.rFull,
                    background: T.white,
                    border: `1px solid ${T.tertiaryBorder}`,
                    boxShadow: T.shadowSm,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: currentStep === 0 ? "not-allowed" : "pointer",
                    opacity: currentStep === 0 ? 0.3 : 1,
                    pointerEvents: currentStep === 0 ? "none" : "auto",
                    transition: "opacity 0.15s",
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path d="M9.5 3.5L5.5 8L9.5 12.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </ShadButton>

                <ShadButton
                  aria-label="Paso siguiente"
                  onClick={() => setCurrentStep((s) => Math.min(result.steps.length - 1, s + 1))}
                  disabled={currentStep >= result.steps.length - 1}
                  variant="ghost"
                  className="p-0"
                  style={{
                    position: "absolute",
                    top: "50%",
                    right: "10px",
                    transform: "translateY(-50%)",
                    width: "36px",
                    height: "36px",
                    borderRadius: T.rFull,
                    background: T.white,
                    border: `1px solid ${T.tertiaryBorder}`,
                    boxShadow: T.shadowSm,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: currentStep >= result.steps.length - 1 ? "not-allowed" : "pointer",
                    opacity: currentStep >= result.steps.length - 1 ? 0.3 : 1,
                    pointerEvents: currentStep >= result.steps.length - 1 ? "none" : "auto",
                    transition: "opacity 0.15s",
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path d="M6.5 3.5L10.5 8L6.5 12.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </ShadButton>
              </div>

              <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginTop: "12px" }}>
                {result.steps.map((_, si) => {
                  const active = si === currentStep;
                  return (
                    <ShadButton
                      key={si}
                      aria-label={`Ir al paso ${si + 1}`}
                      onClick={() => setCurrentStep(si)}
                      variant="ghost"
                      className="p-0 bg-transparent"
                      style={{
                        appearance: "none",
                        border: "none",
                        background: "transparent",
                        padding: 0,
                        width: active ? "8px" : "6px",
                        height: active ? "8px" : "6px",
                        cursor: "pointer",
                      }}
                    >
                      <span
                        style={{
                          display: "block",
                          width: active ? "8px" : "6px",
                          height: active ? "8px" : "6px",
                          borderRadius: "50%",
                          background: active ? T.black : T.greyMiddle,
                        }}
                      />
                    </ShadButton>
                  );
                })}
              </div>
            </div>
          </div>}

          {result.issues?.length > 0 && <div>
            <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: T.textSecondary, marginBottom: "8px" }}>{t.issuesSectionLabel}</div>
            {issuesToShow.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {issuesToShow.map((issue, ii) => (
                  <div key={ii} style={{ display: "flex", gap: "16px", padding: "16px 0" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px", flexShrink: 0 }}>
                      <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" }}>
                        <ShadBadge variant="outline" className={issueSeverityBadgeClass(issue.severity)}>
                          {t.sevLabels[issue.severity]}
                        </ShadBadge>
                        {issue.category ? (
                          <ShadBadge variant="outline" className={issueCategoryBadgeClass}>
                            {catLabelMap[issue.category]}
                          </ShadBadge>
                        ) : null}
                      </div>
                      {issue.component ? (
                        <ShadBadge
                          variant="default"
                          className="whitespace-normal break-words max-w-full"
                        >
                          {issue.component}
                        </ShadBadge>
                      ) : null}
                    </div>

                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontSize: "14px", color: T.black, lineHeight: 1.5 }}>
                        {issue.description}
                      </p>
                      {issue.action ? (
                        <p style={{ margin: "8px 0 0", fontSize: "13px", lineHeight: 1.5, color: T.textSecondary }}>
                          → {issue.action}
                        </p>
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
            <ShadCard
              className="rounded-md p-4 border border-[var(--color-tertiary-border)] bg-[var(--color-beige-25)] shadow-none border-l-[3px] border-l-[var(--color-primary)]"
            >
              <p
                className="m-0 text-[14px] italic"
                style={{ color: "var(--color-basics-text-secondary)", lineHeight: 1.5 }}
              >
                "{result.verbatim}"
              </p>
            </ShadCard>
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
  const [activeTab, setActiveTab] = useState<"simple" | "pro">("simple");
  const t = TRANSLATIONS[language];

  const toggle = (id: string) => setSelectedPersonas(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  const canAdd = customPersona.name && customPersona.description;
  const simpleCount = selectedPersonas.filter(id => (PRESET_PERSONAS.find(p => p.id === id)?.category ?? "simple") === "simple").length;
  const proCount = selectedPersonas.filter(id => (PRESET_PERSONAS.find(p => p.id === id)?.category ?? "simple") === "pro").length;
  const totalSelected = simpleCount + proCount;
  let counterText = "";
  if (totalSelected === 0) counterText = "Selecciona al menos un perfil";
  else {
    const parts: string[] = [];
    if (simpleCount > 0) parts.push(`${simpleCount} usuario${simpleCount !== 1 ? "s" : ""}`);
    if (proCount > 0) parts.push(`${proCount} pro`);
    counterText = parts.join(" + ") + " seleccionado" + (totalSelected !== 1 ? "s" : "");
  }

  const addCustom = () => {
    if (!canAdd) return;
    const id = `custom-${Date.now()}`;
    PRESET_PERSONAS.push({ id, name: customPersona.name, category: "simple", initials: customPersona.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase(), avatarBg: T.beige50, avatarColor: T.black, description: customPersona.description, traits: customPersona.traits.split(",").map(t => t.trim()).filter(Boolean), frustration: "medium", techLevel: "medium" });
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
          fit_score: 0,
          fit_note: "",
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

        {/* Dialog (Step 0) */}
        <Dialog open={showModal} onOpenChange={setShowModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t.modalTitle}</DialogTitle>
              <DialogDescription>{t.modalDesc}</DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <ShadLabel htmlFor="custom-name">{t.nameLabel}</ShadLabel>
                <ShadInput
                  id="custom-name"
                  value={customPersona.name}
                  onChange={e => setCustomPersona(p => ({ ...p, name: e.target.value }))}
                  placeholder={t.namePlaceholder}
                />
              </div>

              <div className="flex flex-col gap-2">
                <ShadLabel htmlFor="custom-desc">{t.descLabel}</ShadLabel>
                <ShadTextarea
                  id="custom-desc"
                  value={customPersona.description}
                  onChange={e => setCustomPersona(p => ({ ...p, description: e.target.value }))}
                  placeholder={t.descPlaceholder}
                  rows={4}
                />
              </div>

              <div className="flex flex-col gap-2">
                <ShadLabel htmlFor="custom-traits">
                  {t.traitsLabel}
                  <span className="font-normal text-muted-foreground"> {t.traitsSuffix}</span>
                </ShadLabel>
                <ShadInput
                  id="custom-traits"
                  value={customPersona.traits}
                  onChange={e => setCustomPersona(p => ({ ...p, traits: e.target.value }))}
                  placeholder={t.traitsPlaceholder}
                />
              </div>
            </div>

            <DialogFooter>
              <ShadButton variant="outline" onClick={() => setShowModal(false)}>
                {t.cancelBtn}
              </ShadButton>
              <ShadButton onClick={addCustom} disabled={!canAdd}>
                {t.createBtn}
              </ShadButton>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <ProgressBar steps={t.steps} current={step} />

        {/* Step 0 */}
        {step === 0 && <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <p style={{ margin: 0, fontSize: "14px", color: T.black }}>{counterText}</p>
            <ShadButton
              variant="secondary"
              onClick={() => setShowModal(true)}
              className="h-9 px-4 text-sm"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
              {t.newBtn}
            </ShadButton>
          </div>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList
              className="w-full bg-[var(--color-grey-soft)] rounded-xl p-1 mb-5"
            >
              <TabsTrigger
                value="simple"
                className="flex flex-col items-start justify-start rounded-lg px-4 py-3"
              >
                <div className="text-sm font-bold text-[var(--color-basics-black)] mb-1">👤 Usuarios</div>
                <div className="text-xs text-muted-foreground">
                  Simulan personas reales usando tu producto
                </div>
              </TabsTrigger>
              <TabsTrigger
                value="pro"
                className="flex flex-col items-start justify-start rounded-lg px-4 py-3"
              >
                <div className="text-sm font-bold text-[var(--color-basics-black)] mb-1">🔬 Pro</div>
                <div className="text-xs text-muted-foreground">
                  Expertos UX/UI que dan feedback accionable
                </div>
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {PRESET_PERSONAS.filter(p => p.category === activeTab).map(p => (
              <PersonaCard key={p.id} persona={p} selected={selectedPersonas.includes(p.id)} onToggle={toggle} />
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", alignSelf: "center", alignItems: "stretch" }}>
            <ShadButton
              size="lg"
              onClick={() => setStep(1)}
              disabled={totalSelected === 0}
              className="w-full"
            >
              {t.nextBtn} ({totalSelected})
            </ShadButton>
          </div>
        </div>}

        {/* Step 1 */}
        {step === 1 && <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div>
            <ShadLabel htmlFor="flow-input">{t.linkLabel}</ShadLabel>
            <ShadInput
              id="flow-input"
              value={flowInput}
              onChange={e => setFlowInput(e.target.value)}
              placeholder={t.linkPlaceholder}
            />
          </div>
          <div>
            <ShadLabel htmlFor="product-context">
              {t.contextLabel} <span className="font-normal text-muted-foreground">{t.contextOptional}</span>
            </ShadLabel>
            <ShadTextarea
              id="product-context"
              value={productContext}
              onChange={e => setProductContext(e.target.value)}
              placeholder={t.contextPlaceholder}
              rows={7}
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", alignSelf: "center", alignItems: "stretch" }}>
            <ShadButton
              onClick={() => { setStep(2); run(); }}
              disabled={!flowInput.trim()}
              className="w-full h-10"
            >
              {t.launchBtn}
            </ShadButton>
            <ShadButton
              variant="outline"
              onClick={() => setStep(0)}
              className="w-full h-10"
            >
              {t.backBtn}
            </ShadButton>
          </div>
        </div>}

        {/* Step 2 */}
        {step === 2 && loading && (
          <ShadCard className="p-0 border border-[var(--color-tertiary-border)] shadow-xs">
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "28px",
                padding: "60px 20px",
              }}
            >
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
              {loadingPhase === "analyzing" && progress.total > 0 && (
                <>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "16px", fontWeight: 600, color: T.black }}>{progress.currentPersona}</div>
                    <div style={{ fontSize: "13px", color: T.textSecondary, marginTop: "4px" }}>{t.userOf(progress.current, progress.total)}</div>
                  </div>
                  <ShadProgress value={(progress.current / progress.total) * 100} className="w-[180px]" />
                </>
              )}
            </div>
          </ShadCard>
        )}

        {/* Step 3 */}
        {step === 3 && results && <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div className="grid grid-cols-4 gap-2.5">
            {([
              { l: t.scoreLabel, v: avg, variant: (avgScore >= 7 ? "success" : avgScore >= 4 ? "warning" : "error") as BadgeVariant },
              { l: t.issuesLabel, v: issueCount, variant: "warning" as BadgeVariant },
              { l: t.criticalLabel, v: critCount, variant: "error" as BadgeVariant },
              { l: t.retentionLabel, v: `${retainCount}/${results.length}`, variant: "success" as BadgeVariant },
            ]).map((m, i) => {
              const badgeClass =
                m.variant === "success"
                  ? "bg-[var(--color-accent-100)] text-[var(--color-accent-700)] border-[var(--color-accent-300)]"
                  : m.variant === "warning"
                    ? "bg-[var(--color-warning-2)] text-[var(--color-warning-1)] border-[var(--color-warning-1)]"
                    : "bg-[var(--color-error-3)] text-[var(--color-error-1)] border-[var(--color-error-2)]";

              return (
                <ShadCard key={i} className="p-4 text-center border border-[var(--color-tertiary-border)] shadow-xs">
                  <div className="text-3xl font-extrabold text-[var(--color-basics-black)] mb-1.5">{m.v}</div>
                  <ShadBadge variant="outline" className={`border ${badgeClass}`}>
                    {m.l}
                  </ShadBadge>
                </ShadCard>
              );
            })}
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
                <ShadButton
                  key={id}
                  onClick={() => setIssueCategoryFilter(id)}
                  variant={issueCategoryFilter === id ? "default" : "outline"}
                  size="sm"
                  className="rounded-full"
                >
                  {label}
                </ShadButton>
              ))}
            </div>
          </div>
          {results.map((r, i) => <ResultCard key={i} result={r} index={i} t={t} issueCategoryFilter={issueCategoryFilter} />)}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", alignSelf: "center", alignItems: "stretch", marginTop: "8px" }}>
            <ShadButton onClick={() => { setStep(0); setResults(null); }} className="rounded-full">
              {t.newTestBtn}
            </ShadButton>
            <ShadButton variant="secondary" onClick={() => { setStep(1); setResults(null); }} className="rounded-full">
              {t.editFlowBtn}
            </ShadButton>
          </div>
        </div>}
      </div>
    </div>
  );
}
