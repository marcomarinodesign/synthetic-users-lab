import type { Persona, SimulationResult, SourceType } from "@/types";

function buildSystemPrompt(persona: Persona, productContext: string): string {
  return `Eres un simulador de usuario sintético para testing de productos digitales.
Actúa EXACTAMENTE como este perfil evaluando un flujo de producto.

PERFIL: ${persona.name}
Descripción: ${persona.description}
Rasgos: ${persona.traits.join(", ")}
Frustración: ${persona.frustration} | Nivel técnico: ${persona.techLevel}

PRODUCTO: ${productContext || "Sin contexto adicional."}

INSTRUCCIONES:
1. Recorre el flujo paso a paso como este usuario
2. Describe qué haría, pensaría y sentiría en cada paso
3. Identifica fricciones, confusiones y momentos de abandono
4. Sé BRUTALMENTE HONESTO desde esta perspectiva

Responde SOLO JSON válido (sin markdown ni backticks):
{"score":<1-10>,"summary":"<2-3 frases>","steps":[{"action":"<qué hace>","reaction":"<qué piensa>"}],"issues":[{"severity":"critical|warning|info","description":"<problema>"}],"wouldReturn":<bool>,"verbatim":"<frase textual>"}`;
}

function repairJSON(raw: string): SimulationResult | null {
  const clean = raw.replace(/```json|```/g, "").trim();

  // Attempt 1: direct parse
  try {
    return JSON.parse(clean);
  } catch {
    // continue
  }

  // Attempt 2: repair truncated JSON
  let repaired = clean;
  const quoteCount = (repaired.match(/(?<!\\)"/g) || []).length;
  if (quoteCount % 2 !== 0) repaired += '"';
  repaired = repaired.replace(/,\s*$/, "");
  const opens = (repaired.match(/[\[{]/g) || []).length;
  const closes = (repaired.match(/[\]}]/g) || []).length;
  for (let j = 0; j < opens - closes; j++) {
    repaired += repaired.lastIndexOf("[") > repaired.lastIndexOf("{") ? "]" : "}";
  }
  try {
    return JSON.parse(repaired);
  } catch {
    // continue
  }

  // Attempt 3: regex extraction
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

export async function simulatePersona(
  persona: Persona,
  sourceType: SourceType,
  flowInput: string,
  productContext: string,
  apiKey?: string
): Promise<SimulationResult> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (apiKey) {
    headers["x-api-key"] = apiKey;
    headers["anthropic-version"] = "2023-06-01";
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system: buildSystemPrompt(persona, productContext),
      messages: [
        {
          role: "user",
          content: `FUENTE: ${sourceType.toUpperCase()}\n\nFLUJO:\n${flowInput}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`API ${response.status}`);
  }

  const data = await response.json();
  const text = data.content?.map((c: { text?: string }) => c.text || "").join("") || "";
  const parsed = repairJSON(text);

  if (!parsed) {
    throw new Error("Could not parse response");
  }

  return { ...parsed, personaId: persona.id };
}
