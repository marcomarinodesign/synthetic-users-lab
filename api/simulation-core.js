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

export const ISSUES_SCHEMA = `{"severity":"${ISSUE_SEVERITIES.join("|")}","description":"<issue>","action":"<concrete specific improvement>","component":"<affected element or screen>","category":"${ISSUE_CATEGORIES.join("|")}"}`;

function outputLanguageBlock(langName, language) {
  return `PRIMARY OUTPUT LANGUAGE: ${langName} (code: ${language}).
All human-readable strings in your JSON (summary, fit_note, every step action/reaction, every issue field, verbatim) MUST be written ONLY in ${langName}. Do not mix languages. The instructions below are in English to avoid biasing the output language toward any single natural language.`;
}

export function buildSystemPrompt({ persona, productContext, language = "es" }) {
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

export function buildUserPrompt({ sourceType, flowInput, language = "es" }) {
  const langName = LANGUAGE_NAMES[language] ?? language;
  return `The FLOW below may be in any language (or mixed). IGNORE that language for your reply.

REQUIRED OUTPUT LANGUAGE FOR ALL JSON TEXT FIELDS: ${langName} (code: ${language}).

SOURCE: ${(sourceType || "description").toUpperCase()}

FLOW:
${flowInput}`;
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
