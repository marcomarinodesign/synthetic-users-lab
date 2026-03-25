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

/** Límites por modo: misma pipeline de dos fases, distinto techo de salida y temperatura persona. */
export const ANALYSIS_MODE_CONFIG = {
  max: {
    objective: { maxOutputTokens: 4096, temperature: 0.2 },
    persona: { maxOutputTokens: 8192, temperature: 0.55 },
  },
  fast: {
    objective: { maxOutputTokens: 2048, temperature: 0.2 },
    persona: { maxOutputTokens: 4096, temperature: 0.35 },
  },
};

/** @param {string} [mode] */
export function resolveAnalysisMode(mode) {
  return mode === "fast" ? "fast" : "max";
}

export const LANGUAGE_NAMES = {
  es: "español",
  en: "English",
  fr: "français",
  pt: "português",
  de: "Deutsch",
};

export const EXPERT_PERSONA_IDS = new Set(["ux-researcher", "ui-designer", "product-strategist"]);

export const ISSUES_SCHEMA = `{"severity":"${ISSUE_SEVERITIES.join("|")}","description":"<issue>","action":"<concrete specific improvement>","component":"<affected element or screen>","category":"${ISSUE_CATEGORIES.join("|")}"}`;
const ISSUE_SEVERITY_ORDER = { critical: 0, warning: 1, info: 2 };
const ISSUE_CATEGORY_ORDER = { ux: 0, ui: 1, product: 2, copy: 3 };

function outputLanguageBlock(langName, language) {
  return `PRIMARY OUTPUT LANGUAGE: ${langName} (code: ${language}).
All human-readable strings in your JSON (summary, fit_note, every step action/reaction, every issue field, verbatim) MUST be written ONLY in ${langName}. Do not mix languages. The instructions below are in English to avoid biasing the output language toward any single natural language.`;
}

export function buildSystemPrompt({ persona, productContext, language = "en" }) {
  const isExpert = EXPERT_PERSONA_IDS.has(persona.id);
  const langName = LANGUAGE_NAMES[language] ?? language;
  const profileTraits = Array.isArray(persona.traits) ? persona.traits.join(", ") : "";
  const langBlock = outputLanguageBlock(langName, language);

  if (isExpert) {
    return `${langBlock}

You are a synthetic expert simulator for digital product testing.
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

IMPORTANT — EVALUATION RULE (UX first, then PMF):
Your job is to evaluate USER EXPERIENCE (UX/UI), NOT whether you personally like the product.
Even if the product does not fit your profile:
- Still evaluate onboarding, value proposition clarity, and navigation
- Identify friction, confusion, and drop-off points
- Give specific feedback on EVERY step of the journey
- ALWAYS complete the full journey (minimum 5 steps) even if the product does not fit your profile
NEVER conclude with "I'm not interested." If the product is not for you, explain WHY the experience did not convince you and WHAT you would change.

Also separate two metrics:
- "score" (1-10) measures ONLY UX quality (how well the experience works)
- "fit_score" (1-10) measures product–persona fit (PMF for this persona)

IMPORTANT — ISSUE FORMAT:
Each issue MUST include:
- "description": the problem and why it impacts the user
- "action": a CONCRETE, SPECIFIC improvement — not "improve the button"; give explicit changes (styles, copy, layout, sizes) so it can be implemented without follow-up questions
- "component": name of the affected element or screen (e.g. "Hero CTA", "Onboarding step 3", "Pricing card")
- "category": one of ux / ui / product / copy

Actions must be specific enough that a designer or developer can ship them without asking anything else.

FINAL LANGUAGE CHECK: Every string value in the JSON must be in ${langName} only.

Respond with ONLY valid JSON (no markdown, no backticks):
{"score":<1-10>,"fit_score":<1-10>,"fit_note":"<1 sentence explaining the product-perf fit>","summary":"<2-3 sentences>","steps":[{"action":"<what they do>","reaction":"<what they think>"}],"issues":[${ISSUES_SCHEMA}],"wouldReturn":<bool>,"verbatim":"<literal quote from the persona>"}`;
  }

  return `${langBlock}

You are a synthetic user simulator for digital product testing.
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

IMPORTANT — EVALUATION RULE (UX first, then PMF):
Your job is to evaluate USER EXPERIENCE (UX/UI), NOT whether you personally like the product.
Even if the product does not fit your profile:
- Still evaluate onboarding, value proposition clarity, and navigation
- Identify friction, confusion, and drop-off points
- Give specific feedback on EVERY step of the journey
- ALWAYS complete the full journey (minimum 5 steps) even if the product does not fit your profile
NEVER conclude with "I'm not interested." If the product is not for you, explain WHY the experience did not convince you and WHAT you would change.

Also separate two metrics:
- "score" (1-10) measures ONLY UX quality (how well the experience works)
- "fit_score" (1-10) measures product–persona fit (PMF for this persona)

FINAL LANGUAGE CHECK: Every string value in the JSON must be in ${langName} only.

Respond with ONLY valid JSON (no markdown, no backticks):
{"score":<1-10>,"fit_score":<1-10>,"fit_note":"<1 sentence explaining the product-perf fit>","summary":"<2-3 sentences>","steps":[{"action":"<what they do>","reaction":"<what they think>"}],"issues":[${ISSUES_SCHEMA}],"wouldReturn":<bool>,"verbatim":"<literal quote from the persona>"}`;
}

export function buildUserPrompt({ sourceType, flowInput, language = "en" }) {
  const langName = LANGUAGE_NAMES[language] ?? language;
  return `The FLOW below may be in any language (or mixed). IGNORE that language for your reply.

REQUIRED OUTPUT LANGUAGE FOR ALL JSON TEXT FIELDS: ${langName} (code: ${language}).

SOURCE: ${(sourceType || "description").toUpperCase()}

FLOW:
${flowInput}`;
}

export function repairJSON(raw) {
  const normalizeSteps = (input) => {
    if (!Array.isArray(input)) return [];
    return input
      .map((s) => {
        if (!s || typeof s !== "object") return null;
        const action = typeof s.action === "string" ? s.action.trim() : "";
        const reaction = typeof s.reaction === "string" ? s.reaction.trim() : "";
        if (!action && !reaction) return null;
        return { action, reaction };
      })
      .filter(Boolean);
  };

  const normalizeIssues = (input) => {
    if (!Array.isArray(input)) return null;
    const out = input
      .map((i) => {
        if (!i || typeof i !== "object") return null;
        const severity = ISSUE_SEVERITIES.includes(i.severity) ? i.severity : "warning";
        const description = typeof i.description === "string" ? i.description.trim() : "";
        if (!description) return null;
        const action = typeof i.action === "string" && i.action.trim() ? i.action.trim() : undefined;
        const component = typeof i.component === "string" && i.component.trim() ? i.component.trim() : undefined;
        const category = ISSUE_CATEGORIES.includes(i.category) ? i.category : "ux";
        return { severity, description, action, component, category };
      })
      .filter(Boolean);
    return out.length > 0 ? out : null;
  };

  const canonicalizeIssues = (issues) => {
    const sorted = [...issues].sort((a, b) => {
      const sev = (ISSUE_SEVERITY_ORDER[a.severity] ?? 9) - (ISSUE_SEVERITY_ORDER[b.severity] ?? 9);
      if (sev !== 0) return sev;
      const cat = (ISSUE_CATEGORY_ORDER[a.category] ?? 9) - (ISSUE_CATEGORY_ORDER[b.category] ?? 9);
      if (cat !== 0) return cat;
      return a.description.localeCompare(b.description, "en", { sensitivity: "base" });
    });
    const deduped = [];
    const seen = new Set();
    for (const issue of sorted) {
      const key = `${issue.category}|${issue.description.toLowerCase()}`;
      if (seen.has(key)) continue;
      seen.add(key);
      deduped.push(issue);
    }
    return deduped;
  };

  const normalize = (input) => {
    const safe = input && typeof input === "object" ? input : {};
    const score = typeof safe.score === "number" && Number.isFinite(safe.score) ? safe.score : 5;
    const fitScore = typeof safe.fit_score === "number" && Number.isFinite(safe.fit_score) ? safe.fit_score : 5;
    const fitNote = typeof safe.fit_note === "string" ? safe.fit_note : "";
    const summary = typeof safe.summary === "string" && safe.summary.trim() ? safe.summary : "Respuesta parcial.";
    const steps = normalizeSteps(safe.steps);
    const normalizedIssues = normalizeIssues(safe.issues);
    const issues = normalizedIssues
      ? canonicalizeIssues(normalizedIssues)
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

const GEMINI_SEED_MOD = 2147483647;

/**
 * Seed estable para misma entrada preparada + mismo perfil (reproducibilidad).
 * @param {string} flowInput — mismo string que recibe el modelo (p. ej. contenido fetch de URL)
 * @param {string} personaId
 */
export function flowPersonaSeed(flowInput, personaId) {
  const str = `${flowInput}\0${personaId}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % GEMINI_SEED_MOD;
}

/** Fase 0 = análisis objetivo, fase 1 = simulación con persona (mismo baseSeed, RNG distinto). */
export function phaseSeed(baseSeed, phase) {
  const p = typeof phase === "number" && phase >= 0 ? phase : 0;
  return (baseSeed + p) % GEMINI_SEED_MOD;
}

function objectiveOutputLanguageBlock(langName, language) {
  return `PRIMARY OUTPUT LANGUAGE: ${langName} (code: ${language}).
All human-readable strings in your JSON (elements, flow, objective_issues, strengths, copy_samples) MUST be written ONLY in ${langName}. Do not mix languages. The instructions below are in English to avoid biasing the output language toward any single natural language.`;
}

export function buildObjectiveAnalysisSystemPrompt({ productContext, language = "en" }) {
  const langName = LANGUAGE_NAMES[language] ?? language;
  const langBlock = objectiveOutputLanguageBlock(langName, language);
  return `${langBlock}

You are a neutral UX/product analyst. Analyze the FLOW impersonally (no user persona role).

PRODUCT CONTEXT: ${productContext || "No additional context."}

TASK:
1. List visible UI elements (headers, buttons, sections, forms) as concise strings.
2. Describe the navigation flow step by step.
3. List objective UX issues (contrast, hierarchy, cognitive load, confusing CTAs).
4. List strengths.
5. List copy samples (exact or representative quotes from the flow).

Respond with ONLY valid JSON (no markdown, no backticks):
{"elements":["..."],"flow":["..."],"objective_issues":["..."],"strengths":["..."],"copy_samples":["..."]}`;
}

export function buildObjectiveAnalysisUserPrompt({ sourceType, flowInput, language = "en" }) {
  const langName = LANGUAGE_NAMES[language] ?? language;
  return `The FLOW below may be in any language (or mixed). IGNORE that language for your structured output strings — use ${langName} only.

SOURCE: ${(sourceType || "description").toUpperCase()}

FLOW:
${flowInput}`;
}

function normalizeObjectiveAnalysis(obj) {
  if (!obj || typeof obj !== "object") return null;
  const pick = (k) => {
    if (!Array.isArray(obj[k])) return [];
    const deduped = new Set();
    for (const value of obj[k]) {
      const normalized = String(value).replace(/\s+/g, " ").trim();
      if (normalized) deduped.add(normalized);
    }
    // Cap array sizes to keep anchor context deterministic and bounded.
    return Array.from(deduped).slice(0, 25);
  };
  const elements = pick("elements");
  const flow = pick("flow");
  const objective_issues = pick("objective_issues");
  const strengths = pick("strengths");
  const copy_samples = pick("copy_samples");
  const total = elements.length + flow.length + objective_issues.length + strengths.length + copy_samples.length;
  if (total === 0) return null;
  return { elements, flow, objective_issues, strengths, copy_samples };
}

/**
 * @returns {object | null} objeto normalizado o null si no es usable
 */
export function repairObjectiveAnalysisJSON(raw) {
  if (typeof raw !== "string" || !raw.trim()) return null;
  const clean = raw.replace(/```json|```/g, "").trim();

  const tryParse = (s) => {
    try {
      return JSON.parse(s);
    } catch {
      return null;
    }
  };

  let obj = tryParse(clean);
  if (!obj) {
    const start = clean.indexOf("{");
    const end = clean.lastIndexOf("}");
    if (start >= 0 && end > start) {
      obj = tryParse(clean.slice(start, end + 1));
    }
  }
  if (!obj) return null;
  return normalizeObjectiveAnalysis(obj);
}

export function buildAnchoredUserPrompt({ sourceType, flowInput, language = "en", objectiveAnalysis }) {
  const base = buildUserPrompt({ sourceType, flowInput, language });
  const analysisJson = JSON.stringify(objectiveAnalysis);
  return `${base}

OBJECTIVE ANCHOR (single source of truth for UI elements and flow; do not invent screens or elements outside this analysis):
${analysisJson}

RULES:
- Your steps must follow the "flow" array in the anchor and align with "elements".
- Ground issues in "objective_issues" and filter them through the persona's perspective; you may rephrase or prioritize, but do not invent unrelated problems.
- Emotional tone and verbatim may vary naturally.
- Complete at least 5 journey steps when the anchor flow has 5+ items; if the anchor flow is shorter, cover every step in the anchor flow.`;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * @param {Response} response
 * @param {string} errText
 * @param {number} attemptIndex 0-based
 */
export function geminiRetryDelayMs(response, errText, attemptIndex) {
  const ra = response.headers.get("Retry-After");
  if (ra) {
    const n = parseInt(ra, 10);
    if (!Number.isNaN(n) && n > 0) return Math.min(n * 1000, 120_000);
  }
  const m = String(errText).match(/retry in ([\d.]+)\s*s/i);
  if (m) {
    const sec = parseFloat(m[1]);
    if (Number.isFinite(sec) && sec > 0) return Math.min(Math.ceil(sec * 1000), 120_000);
  }
  const base = 2500;
  return Math.min(base * 2 ** attemptIndex, 60_000);
}

/**
 * Mensaje legible para el cliente (ES) a partir de la respuesta HTTP de Gemini.
 * @param {number} status
 * @param {string} errText
 */
export function formatGeminiErrorForClient(status, errText) {
  let msg = `Gemini API error: ${status}`;
  try {
    const errJson = JSON.parse(errText);
    const geminiMsg = errJson?.error?.message || "";
    if (status === 400 && (geminiMsg.includes("API key") || geminiMsg.includes("invalid"))) {
      return "API key inválida o bloqueada. Crea una NUEVA key en https://aistudio.google.com/app/apikey";
    }
    const quotaLike =
      status === 429 ||
      /quota exceeded|RESOURCE_EXHAUSTED|rate limit|too many requests/i.test(geminiMsg);
    if (quotaLike) {
      return "Cuota de la API de Gemini agotada o límite de peticiones. Opciones: activar facturación en Google AI (https://ai.google.dev/pricing), usar otra API key, o esperar unos minutos y reintentar.";
    }
    if (geminiMsg) msg = geminiMsg;
  } catch {
    // ignore
  }
  return msg;
}

const GEMINI_HTTP_MAX_ATTEMPTS = 6;

/**
 * @param {string} apiKey
 * @param {{ systemInstruction?: string, userText: string, generationConfig: Record<string, unknown> }} opts
 * @returns {Promise<string>}
 */
export async function callGemini(apiKey, { systemInstruction, userText, generationConfig }) {
  const body = {
    contents: [{ parts: [{ text: userText }] }],
    generationConfig,
  };
  if (systemInstruction && systemInstruction.trim()) {
    body.systemInstruction = { parts: [{ text: systemInstruction }] };
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

  for (let attempt = 1; attempt <= GEMINI_HTTP_MAX_ATTEMPTS; attempt++) {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey.trim(),
      },
      body: JSON.stringify(body),
    });

    if (response.ok) {
      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("") || "";
      return text;
    }

    const errText = await response.text();
    const retryable =
      (response.status === 429 || response.status === 503) && attempt < GEMINI_HTTP_MAX_ATTEMPTS;
    if (retryable) {
      const delayMs = geminiRetryDelayMs(response, errText, attempt - 1);
      console.warn(
        `[SyntheticUsers] Gemini HTTP ${response.status}, reintento ${attempt}/${GEMINI_HTTP_MAX_ATTEMPTS} en ${delayMs}ms`
      );
      await sleep(delayMs);
      continue;
    }

    const err = new Error(`Gemini API error: ${response.status}`);
    err.status = response.status;
    err.body = errText;
    throw err;
  }

  throw new Error("Gemini API: agotados reintentos");
}

/**
 * @param {object} params
 * @param {string} params.apiKey
 * @param {object} params.persona
 * @param {string} params.sourceType
 * @param {string} params.flowInput
 * @param {string} params.productContext
 * @param {string} [params.language]
 * @param {number} params.baseSeed
 * @param {"fast"|"max"} [params.analysisMode]
 */
export async function runSimulateWithPhases({ apiKey, persona, sourceType, flowInput, productContext, language, baseSeed, analysisMode }) {
  return runSimulateWithPhasesObservable({
    apiKey,
    persona,
    sourceType,
    flowInput,
    productContext,
    language,
    baseSeed,
    analysisMode,
  });
}

/**
 * Igual que runSimulateWithPhases, pero emite hitos para streaming/UI.
 * Todos los callbacks son opcionales.
 */
export async function runSimulateWithPhasesObservable({
  apiKey,
  persona,
  sourceType,
  flowInput,
  productContext,
  language,
  baseSeed,
  onPhaseStart,
  onPhaseDone,
  onModelCallStart,
  onModelCallDone,
  analysisMode = "max",
}) {
  const lang = language || "en";
  const mode = resolveAnalysisMode(analysisMode);
  const genCfg = ANALYSIS_MODE_CONFIG[mode];
  const seedA = phaseSeed(baseSeed, 0);
  const seedB = phaseSeed(baseSeed, 1);

  onPhaseStart?.({ phase: "objective_analysis" });
  onModelCallStart?.({ phase: "objective_analysis", model: GEMINI_MODEL });
  const sysA = buildObjectiveAnalysisSystemPrompt({ productContext, language: lang });
  const userA = buildObjectiveAnalysisUserPrompt({ sourceType, flowInput, language: lang });
  const textA = await callGemini(apiKey, {
    systemInstruction: sysA,
    userText: userA,
    generationConfig: {
      maxOutputTokens: genCfg.objective.maxOutputTokens,
      temperature: genCfg.objective.temperature,
      seed: seedA,
    },
  });
  onModelCallDone?.({ phase: "objective_analysis", model: GEMINI_MODEL });

  const analysis = repairObjectiveAnalysisJSON(textA);
  if (!analysis) {
    const err = new Error("OBJECTIVE_ANALYSIS_PARSE_FAILED");
    err.code = "OBJECTIVE_ANALYSIS_PARSE_FAILED";
    throw err;
  }
  onPhaseDone?.({ phase: "objective_analysis" });

  onPhaseStart?.({ phase: "persona_simulation" });
  onModelCallStart?.({ phase: "persona_simulation", model: GEMINI_MODEL });
  const systemPrompt = buildSystemPrompt({ persona, productContext, language: lang });
  const userPrompt = buildAnchoredUserPrompt({
    sourceType,
    flowInput,
    language: lang,
    objectiveAnalysis: analysis,
  });

  const textB = await callGemini(apiKey, {
    systemInstruction: systemPrompt,
    userText: userPrompt,
    generationConfig: {
      maxOutputTokens: genCfg.persona.maxOutputTokens,
      temperature: genCfg.persona.temperature,
      seed: seedB,
    },
  });
  onModelCallDone?.({ phase: "persona_simulation", model: GEMINI_MODEL });

  if (!textB.trim()) {
    const err = new Error("SIMULATION_EMPTY");
    err.code = "SIMULATION_EMPTY";
    throw err;
  }

  const parsed = repairJSON(textB);
  if (!parsed) {
    const err = new Error("SIMULATION_PARSE_FAILED");
    err.code = "SIMULATION_PARSE_FAILED";
    throw err;
  }
  onPhaseDone?.({ phase: "persona_simulation" });
  return parsed;
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
