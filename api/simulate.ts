import type { VercelRequest, VercelResponse } from "@vercel/node";

const GEMINI_MODEL = "gemini-2.5-flash";

const LANGUAGE_NAMES: Record<string, string> = {
  es: "español",
  en: "English",
  fr: "français",
  pt: "português",
  de: "Deutsch",
};

interface SimulateBody {
  persona: {
    id: string;
    name: string;
    description: string;
    traits: string[];
    frustration: string;
    techLevel: string;
  };
  sourceType: string;
  flowInput: string;
  productContext: string;
  language?: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey?.trim()) {
    return res.status(500).json({ error: "GEMINI_API_KEY not configured" });
  }

  const body = req.body as SimulateBody;
  const { persona, sourceType, flowInput, productContext, language = "es" } = body;

  if (!persona || !flowInput) {
    return res.status(400).json({ error: "Missing persona or flowInput" });
  }

  const langName = LANGUAGE_NAMES[language] ?? language;

  const expertPersonaIds = new Set(["ux-researcher", "ui-designer", "product-strategist"]);
  const isExpert = expertPersonaIds.has(persona.id);

  const issuesSchema = `{"severity":"critical|warning|info","description":"<issue>","action":"<mejora concreta y específica>","component":"<elemento/pantalla afectada>","category":"ux|ui|product|copy"}`;

  const systemPrompt = isExpert
    ? `You are a synthetic expert simulator for digital product testing.
Act EXACTLY as this expert when evaluating a product flow.

PROFILE: ${persona.name}
Description: ${persona.description}
Traits: ${persona.traits.join(", ")}
Frustration: ${persona.frustration} | Tech level: ${persona.techLevel}

PRODUCT CONTEXT: ${productContext || "No additional context."}

INSTRUCTIONS (PROFESSIONAL EVALUATION):
1. Walk through the flow step by step and validate UX reasoning as an expert would
2. Describe what friction/confusion happens, and why it impacts the user
3. Turn each issue into an implementable improvement ticket
4. Be BRUTALLY HONEST from this expert's perspective

IMPORTANTE — FORMATO DE ISSUES:
Cada issue DEBE incluir:
- "description": qué problema detectas y por qué impacta al usuario
- "action": mejora CONCRETA y ESPECÍFICA. No digas "mejorar el botón" — di cambios explícitos (estilos, texto, layout, tamaños) que permitan implementarlo sin preguntar.
- "component": nombre del elemento o pantalla afectada (ej: "Hero CTA", "Onboarding step 3", "Pricing card")
- "category": clasificación (ux/ui/product/copy)

Las acciones deben ser tan específicas que un diseñador o developer pueda implementarlas sin preguntar nada más.

LANGUAGE RULE: Write ALL text values in the JSON in ${langName}. This is mandatory — do not use any other language regardless of the source content language.

Respond with ONLY valid JSON (no markdown, no backticks):
{"score":<1-10>,"summary":"<2-3 sentences>","steps":[{"action":"<what they do>","reaction":"<what they think>"}],"issues":[${issuesSchema}],"wouldReturn":<bool>,"verbatim":"<literal quote from the persona>"}`
    : `You are a synthetic user simulator for digital product testing.
Act EXACTLY as this profile when evaluating a product flow.

PROFILE: ${persona.name}
Description: ${persona.description}
Traits: ${persona.traits.join(", ")}
Frustration: ${persona.frustration} | Tech level: ${persona.techLevel}

PRODUCT CONTEXT: ${productContext || "No additional context."}

INSTRUCTIONS:
1. Walk through the flow step by step as this user
2. Describe what they would do, think and feel at each step
3. Identify friction, confusion and drop-off moments
4. Be BRUTALLY HONEST from this persona's perspective

LANGUAGE RULE: Write ALL text values in the JSON in ${langName}. This is mandatory — do not use any other language regardless of the source content language.

Respond with ONLY valid JSON (no markdown, no backticks):
{"score":<1-10>,"summary":"<2-3 sentences>","steps":[{"action":"<what they do>","reaction":"<what they think>"}],"issues":[${issuesSchema}],"wouldReturn":<bool>,"verbatim":"<literal quote from the persona>"}`;

  const userPrompt = `SOURCE: ${sourceType.toUpperCase()}\n\nFLOW:\n${flowInput}`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey.trim(),
        },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: [{ parts: [{ text: userPrompt }] }],
          generationConfig: {
            maxOutputTokens: 8192,
            temperature: 0.7,
          },
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error("Gemini API error:", response.status, errText);
      let msg = `Gemini API error: ${response.status}`;
      try {
        const errJson = JSON.parse(errText) as { error?: { message?: string } };
        const geminiMsg = errJson?.error?.message || "";
        if (response.status === 400 && (geminiMsg.includes("API key") || geminiMsg.includes("invalid"))) {
          msg = "API key inválida o bloqueada. Crea una NUEVA key en https://aistudio.google.com/app/apikey";
        } else if (geminiMsg) {
          msg = geminiMsg;
        }
      } catch {
        // ignore
      }
      return res.status(response.status === 400 ? 400 : 502).json({ error: msg });
    }

    interface GeminiPart {
      text?: string;
    }
    const data = (await response.json()) as {
      candidates?: { content?: { parts?: GeminiPart[] } }[];
    };

    const text =
      data.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("") || "";

    if (!text) {
      return res.status(502).json({ error: "Empty response from Gemini" });
    }

    const parsed = repairJSON(text);
    if (!parsed) {
      return res.status(502).json({ error: "Could not parse Gemini response" });
    }

    return res.status(200).json({ ...parsed, personaId: persona.id });
  } catch (err) {
    console.error("Simulate error:", err);
    return res.status(500).json({
      error: err instanceof Error ? err.message : "Internal server error",
    });
  }
}

function repairJSON(raw: string): Record<string, unknown> | null {
  const clean = raw.replace(/```json|```/g, "").trim();

  try {
    return JSON.parse(clean) as Record<string, unknown>;
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
    return JSON.parse(repaired) as Record<string, unknown>;
  } catch {
    // continue
  }

  const scoreMatch = clean.match(/"score"\s*:\s*(\d+)/);
  const summaryMatch = clean.match(/"summary"\s*:\s*"([^"]*)/);
  const returnMatch = clean.match(/"wouldReturn"\s*:\s*(true|false)/);

  return {
    score: scoreMatch ? parseInt(scoreMatch[1]) : 5,
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
