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
  const returnMatch = clean.match(/"wouldReturn"\s*:\s*(true|false)/);
  return {
    score: scoreMatch ? parseInt(scoreMatch[1]) : 5,
    summary: summaryMatch ? summaryMatch[1] : "Respuesta parcial.",
    steps: [],
    issues: [{ severity: "warning", description: "Respuesta truncada — datos parciales." }],
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

  const systemPrompt = `You are a synthetic user simulator for digital product testing.
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

LANGUAGE RULE: Write ALL text values in the JSON in ${langName}. This is mandatory — do not use any other language regardless of the source content language.

Respond with ONLY valid JSON (no markdown, no backticks):
{"score":<1-10>,"summary":"<2-3 sentences>","steps":[{"action":"<what they do>","reaction":"<what they think>"}],"issues":[{"severity":"critical|warning|info","description":"<issue>"}],"wouldReturn":<bool>,"verbatim":"<literal quote from the persona>"}`;

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
