import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, ".env.local") });
dotenv.config();
import express from "express";

const app = express();
app.use(express.json());

const GEMINI_MODEL = "gemini-2.5-flash";
const PORT = 3001;

function repairJSON(raw) {
  const clean = raw.replace(/```json|```/g, "").trim();
  try {
    return JSON.parse(clean);
  } catch {}
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
    return JSON.parse(repaired);
  } catch {}
  const scoreMatch = clean.match(/"score"\s*:\s*(\d+)/);
  const summaryMatch = clean.match(/"summary"\s*:\s*"([^"]*)/);
  const fitScoreMatch = clean.match(/"fit_score"\s*:\s*(\d+)/);
  const fitNoteMatch = clean.match(/"fit_note"\s*:\s*"([^"]*)/);
  const returnMatch = clean.match(/"wouldReturn"\s*:\s*(true|false)/);
  return {
    score: scoreMatch ? parseInt(scoreMatch[1]) : 5,
    fit_score: fitScoreMatch ? parseInt(fitScoreMatch[1]) : 5,
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
  };
}

async function fetchUrlContent(url) {
  const response = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; SyntheticUsersBot/1.0)" },
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status} al obtener ${url}`);
  const html = await response.text();
  const text = html
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
    .slice(0, 8000);
  return text;
}

app.post("/api/fetch-content", async (req, res) => {
  const { url } = req.body || {};
  if (!url) return res.status(400).json({ error: "Missing url" });
  try {
    const content = await fetchUrlContent(url);
    return res.json({ content });
  } catch (err) {
    return res.status(502).json({ error: err.message || "Failed to fetch URL" });
  }
});

app.post("/api/simulate", async (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    return res.status(400).json({
      error: "GEMINI_API_KEY no configurada. Añádela en .env.local (https://aistudio.google.com/app/apikey)",
    });
  }

  const { persona, sourceType, flowInput, productContext, language = "es" } = req.body || {};
  if (!persona || !flowInput) {
    return res.status(400).json({ error: "Missing persona or flowInput" });
  }

  const languageNames = { es: "español", en: "English", fr: "français", pt: "português", de: "Deutsch" };
  const langName = languageNames[language] ?? language;

  const expertPersonaIds = new Set(["ux-researcher", "ui-designer", "product-strategist"]);
  const isExpert = expertPersonaIds.has(persona.id);

  const issuesSchema = `{"severity":"critical|warning|info","description":"<issue>","action":"<mejora concreta y específica>","component":"<elemento/pantalla afectada>","category":"ux|ui|product|copy"}`;

  const systemPrompt = isExpert
    ? `You are a synthetic expert simulator for digital product testing.
Act EXACTLY as this expert when evaluating a product flow.

PROFILE: ${persona.name}
Description: ${persona.description}
Traits: ${(persona.traits || []).join(", ")}
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
{"score":<1-10>,"fit_score":<1-10>,"fit_note":"<1 sentence explaining the product-perf fit>","summary":"<2-3 sentences>","steps":[{"action":"<what they do>","reaction":"<what they think>"}],"issues":[${issuesSchema}],"wouldReturn":<bool>,"verbatim":"<literal quote from the persona>"}`
    : `You are a synthetic user simulator for digital product testing.
Act EXACTLY as this profile when evaluating a product flow.

PROFILE: ${persona.name}
Description: ${persona.description}
Traits: ${(persona.traits || []).join(", ")}
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
{"score":<1-10>,"fit_score":<1-10>,"fit_note":"<1 sentence explaining the product-perf fit>","summary":"<2-3 sentences>","steps":[{"action":"<what they do>","reaction":"<what they think>"}],"issues":[${issuesSchema}],"wouldReturn":<bool>,"verbatim":"<literal quote from the persona>"}`;

  const userPrompt = `SOURCE: ${(sourceType || "description").toUpperCase()}\n\nFLOW:\n${flowInput}`;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ parts: [{ text: userPrompt }] }],
        generationConfig: {
          maxOutputTokens: 8192,
          temperature: 0.7,
        },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Gemini API error:", response.status, errText);
      let msg = `Gemini API error: ${response.status}`;
      try {
        const errJson = JSON.parse(errText);
        const geminiMsg = errJson?.error?.message || "";
        if (response.status === 400 && (geminiMsg.includes("API key") || geminiMsg.includes("invalid"))) {
          msg = "API key inválida o bloqueada. Crea una NUEVA key en https://aistudio.google.com/app/apikey (las keys expuestas en repos se bloquean automáticamente)";
        } else if (geminiMsg) {
          msg = geminiMsg;
        }
      } catch {}
      return res.status(response.status === 400 ? 400 : 502).json({ error: msg });
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("") || "";

    if (!text) {
      return res.status(502).json({ error: "Empty response from Gemini", raw: JSON.stringify(data).slice(0, 300) });
    }

    const parsed = repairJSON(text);
    if (!parsed) {
      return res.status(502).json({ error: "Could not parse Gemini response", raw: text.slice(0, 500) });
    }

    return res.json({ ...parsed, personaId: persona.id });
  } catch (err) {
    console.error("Simulate error:", err);
    return res.status(500).json({ error: err.message || "Internal server error" });
  }
});

app.listen(PORT, () => {
  console.log(`API server running at http://localhost:${PORT}`);
});
