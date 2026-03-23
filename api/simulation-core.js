import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const enums = JSON.parse(readFileSync(join(__dirname, "../src/domain/simulation.enums.json"), "utf8"));

/** Sincronizado con `src/domain/simulation.enums.json` */
export const ISSUE_SEVERITIES = enums.issueSeverities;
export const ISSUE_CATEGORIES = enums.issueCategories;
export const SOURCE_TYPES = enums.sourceTypes;

export const GEMINI_MODEL = "gemini-2.5-flash";

export const LANGUAGE_NAMES = {
  es: "español",
  en: "English",
  fr: "français",
  pt: "português",
  de: "Deutsch",
};

export const EXPERT_PERSONA_IDS = new Set(["ux-researcher", "ui-designer", "product-strategist"]);

export const ISSUES_SCHEMA = `{"severity":"${ISSUE_SEVERITIES.join("|")}","description":"<issue>","action":"<mejora concreta y específica>","component":"<elemento/pantalla afectada>","category":"${ISSUE_CATEGORIES.join("|")}"}`;

export function buildSystemPrompt({ persona, productContext, language = "es" }) {
  const isExpert = EXPERT_PERSONA_IDS.has(persona.id);
  const langName = LANGUAGE_NAMES[language] ?? language;
  const profileTraits = Array.isArray(persona.traits) ? persona.traits.join(", ") : "";

  if (isExpert) {
    return `You are a synthetic expert simulator for digital product testing.
Act EXACTLY as this expert when evaluating a product flow.

PROFILE: ${persona.name}
Description: ${persona.description}
Traits: ${profileTraits}
Frustration: ${persona.frustration} | Tech level: ${persona.techLevel}

PRODUCT CONTEXT: ${productContext || "No additional context."}

INSTRUCTIONS (PROFESSIONAL EVALUATION):
1. Walk through the flow step by step and validate UX reasoning as an expert would
2. Describe what friction/confusion happens, and why it impacts the user
3. Turn each issue into an implementable improvement ticket
4. Be BRUTALLY HONEST from this expert's perspective

IMPORTANTE — REGLA DE EVALUACIÓN (UX primero, PMF después):
Tu trabajo es evaluar la EXPERIENCIA DE USO (UX/UI), NO si el producto te interesa personalmente.
Incluso si el producto no encaja con tu perfil:
- Evalúa igualmente el onboarding, la claridad de la propuesta de valor y la navegación
- Identifica fricciones, confusiones y puntos de drop-off
- Da feedback específico sobre CADA paso del recorrido
- SIEMPRE completa el recorrido entero (mínimo 5 pasos) aunque el producto no encaje con tu perfil
NUNCA concluyas con "no me interesa". Si el producto no es para ti, explica POR QUÉ la experiencia no te convenció y QUÉ cambiarías para que sí lo fuera.

Además, separa dos métricas:
- "score" (1-10) mide SOLO calidad UX (lo bien que funciona la experiencia)
- "fit_score" (1-10) mide encaje producto-perfil (PMF para esta persona)

IMPORTANTE — FORMATO DE ISSUES:
Cada issue DEBE incluir:
- "description": qué problema detectas y por qué impacta al usuario
- "action": mejora CONCRETA y ESPECÍFICA. No digas "mejorar el botón" — di cambios explícitos (estilos, texto, layout, tamaños) que permitan implementarlo sin preguntar.
- "component": nombre del elemento o pantalla afectada (ej: "Hero CTA", "Onboarding step 3", "Pricing card")
- "category": clasificación (ux/ui/product/copy)

Las acciones deben ser tan específicas que un diseñador o developer pueda implementarlas sin preguntar nada más.

LANGUAGE RULE: Write ALL text values in the JSON in ${langName}. This is mandatory — do not use any other language regardless of the source content language.

Respond with ONLY valid JSON (no markdown, no backticks):
{"score":<1-10>,"fit_score":<1-10>,"fit_note":"<1 sentence explaining the product-perf fit>","summary":"<2-3 sentences>","steps":[{"action":"<what they do>","reaction":"<what they think>"}],"issues":[${ISSUES_SCHEMA}],"wouldReturn":<bool>,"verbatim":"<literal quote from the persona>"}`;
  }

  return `You are a synthetic user simulator for digital product testing.
Act EXACTLY as this profile when evaluating a product flow.

PROFILE: ${persona.name}
Description: ${persona.description}
Traits: ${profileTraits}
Frustration: ${persona.frustration} | Tech level: ${persona.techLevel}

PRODUCT CONTEXT: ${productContext || "No additional context."}

INSTRUCTIONS:
1. Walk through the flow step by step as this user
2. Describe what they would do, think and feel at each step
3. Identify friction, confusion and drop-off moments
4. Be BRUTALLY HONEST from this persona's perspective

IMPORTANTE — REGLA DE EVALUACIÓN (UX primero, PMF después):
Tu trabajo es evaluar la EXPERIENCIA DE USO (UX/UI), NO si el producto te interesa personalmente.
Incluso si el producto no encaja con tu perfil:
- Evalúa igualmente el onboarding, la claridad de la propuesta de valor y la navegación
- Identifica fricciones, confusiones y puntos de drop-off
- Da feedback específico sobre CADA paso del recorrido
- SIEMPRE completa el recorrido entero (mínimo 5 pasos) aunque el producto no encaje con tu perfil
NUNCA concluyas con "no me interesa". Si el producto no es para ti, explica POR QUÉ la experiencia no te convenció y QUÉ cambiarías para que sí lo fuera.

Además, separa dos métricas:
- "score" (1-10) mide SOLO calidad UX (lo bien que funciona la experiencia)
- "fit_score" (1-10) mide encaje producto-perfil (PMF para esta persona)

LANGUAGE RULE: Write ALL text values in the JSON in ${langName}. This is mandatory — do not use any other language regardless of the source content language.

Respond with ONLY valid JSON (no markdown, no backticks):
{"score":<1-10>,"fit_score":<1-10>,"fit_note":"<1 sentence explaining the product-perf fit>","summary":"<2-3 sentences>","steps":[{"action":"<what they do>","reaction":"<what they think>"}],"issues":[${ISSUES_SCHEMA}],"wouldReturn":<bool>,"verbatim":"<literal quote from the persona>"}`;
}

export function buildUserPrompt({ sourceType, flowInput }) {
  return `SOURCE: ${(sourceType || "description").toUpperCase()}\n\nFLOW:\n${flowInput}`;
}

export function repairJSON(raw) {
  const normalize = (input) => {
    const safe = input && typeof input === "object" ? input : {};
    const score = typeof safe.score === "number" && Number.isFinite(safe.score) ? safe.score : 5;
    const fitScore = typeof safe.fit_score === "number" && Number.isFinite(safe.fit_score) ? safe.fit_score : 5;
    const fitNote = typeof safe.fit_note === "string" ? safe.fit_note : "";
    const summary = typeof safe.summary === "string" && safe.summary.trim() ? safe.summary : "Respuesta parcial.";
    const steps = Array.isArray(safe.steps) ? safe.steps : [];
    const issues = Array.isArray(safe.issues)
      ? safe.issues
      : [
          {
            severity: "warning",
            description: "Respuesta truncada — datos parciales.",
            action: "Generar una acción concreta y específica para resolver el problema detectado.",
            component: "Resultados",
            category: "ux",
          },
        ];
    const wouldReturn = typeof safe.wouldReturn === "boolean" ? safe.wouldReturn : null;
    const personaId = typeof safe.personaId === "string" ? safe.personaId : "";

    return {
      ...safe,
      score,
      fit_score: fitScore,
      fit_note: fitNote,
      summary,
      steps,
      issues,
      wouldReturn,
      personaId,
    };
  };

  const clean = raw.replace(/```json|```/g, "").trim();

  try {
    return normalize(JSON.parse(clean));
  } catch {
    // continue
  }

  let repaired = clean;
  const quoteCount = (repaired.match(/(?<!\\)"/g) || []).length;
  if (quoteCount % 2 !== 0) repaired += '"';
  repaired = repaired.replace(/,\s*$/, "");
  const opens = (repaired.match(/[{[]/g) || []).length;
  const closes = (repaired.match(/[\]}]/g) || []).length;
  for (let j = 0; j < opens - closes; j++) {
    repaired += repaired.lastIndexOf("[") > repaired.lastIndexOf("{") ? "]" : "}";
  }

  try {
    return normalize(JSON.parse(repaired));
  } catch {
    // continue
  }

  const scoreMatch = clean.match(/"score"\s*:\s*(\d+)/);
  const summaryMatch = clean.match(/"summary"\s*:\s*"([^"]*)/);
  const fitScoreMatch = clean.match(/"fit_score"\s*:\s*(\d+)/);
  const fitNoteMatch = clean.match(/"fit_note"\s*:\s*"([^"]*)/);
  const returnMatch = clean.match(/"wouldReturn"\s*:\s*(true|false)/);

  return normalize({
    score: scoreMatch ? Number.parseInt(scoreMatch[1], 10) : 5,
    fit_score: fitScoreMatch ? Number.parseInt(fitScoreMatch[1], 10) : 5,
    fit_note: fitNoteMatch ? fitNoteMatch[1] : "",
    summary: summaryMatch ? summaryMatch[1] : "Respuesta parcial.",
    steps: [],
    issues: [
      {
        severity: "warning",
        description: "Respuesta truncada — datos parciales.",
        action: "Generar una acción concreta y específica para resolver el problema detectado.",
        component: "Resultados",
        category: "ux",
      },
    ],
    wouldReturn: returnMatch ? returnMatch[1] === "true" : null,
    personaId: "",
  });
}

export async function fetchUrlContent(url, options = {}) {
  const timeoutMs = typeof options.timeoutMs === "number" ? options.timeoutMs : 10000;
  const maxChars = typeof options.maxChars === "number" ? options.maxChars : 8000;

  const response = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; SyntheticUsersBot/1.0)" },
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status} al obtener ${url}`);

  const html = await response.text();
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, " ")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxChars);
}
