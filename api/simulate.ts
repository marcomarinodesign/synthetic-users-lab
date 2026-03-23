import type { VercelRequest, VercelResponse } from "@vercel/node";
import { GEMINI_MODEL, buildSystemPrompt, buildUserPrompt, repairJSON } from "./simulation-core.js";
import { validateSimulationRequest } from "./validate-simulation-request.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey?.trim()) {
    return res.status(500).json({ error: "GEMINI_API_KEY not configured" });
  }

  const parsed = validateSimulationRequest(req.body);
  if (!parsed.ok) {
    return res.status(400).json({ error: parsed.error });
  }
  const { persona, sourceType, flowInput, productContext, language } = parsed.value;

  const systemPrompt = buildSystemPrompt({ persona, productContext, language });
  const userPrompt = buildUserPrompt({ sourceType, flowInput, language });

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
