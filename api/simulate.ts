import type { VercelRequest, VercelResponse } from "@vercel/node";
import { flowPersonaSeed, runSimulateWithPhases } from "./simulation-core.js";
import { validateSimulationRequest } from "./validate-simulation-request.js";

function geminiHttpErrorMessage(status: number, errText: string): string {
  let msg = `Gemini API error: ${status}`;
  try {
    const errJson = JSON.parse(errText) as { error?: { message?: string } };
    const geminiMsg = errJson?.error?.message || "";
    if (status === 400 && (geminiMsg.includes("API key") || geminiMsg.includes("invalid"))) {
      msg = "API key inválida o bloqueada. Crea una NUEVA key en https://aistudio.google.com/app/apikey";
    } else if (geminiMsg) {
      msg = geminiMsg;
    }
  } catch {
    // ignore
  }
  return msg;
}

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
  const { persona, sourceType, flowInput, productContext, language, seed } = parsed.value;
  const baseSeed = seed !== undefined ? seed : flowPersonaSeed(flowInput, persona.id);

  try {
    const result = await runSimulateWithPhases({
      apiKey: apiKey.trim(),
      persona,
      sourceType,
      flowInput,
      productContext,
      language,
      baseSeed,
    });
    return res.status(200).json({ ...result, personaId: persona.id });
  } catch (err) {
    if (err && typeof err === "object" && "code" in err && (err as { code?: string }).code === "OBJECTIVE_ANALYSIS_PARSE_FAILED") {
      return res.status(502).json({ error: "No se pudo analizar el flujo de forma objetiva. Reintenta." });
    }
    if (err && typeof err === "object" && "code" in err && (err as { code?: string }).code === "SIMULATION_EMPTY") {
      return res.status(502).json({ error: "Empty response from Gemini" });
    }
    if (err && typeof err === "object" && "status" in err) {
      const e = err as { status?: number; body?: string };
      const status = typeof e.status === "number" ? e.status : 502;
      const errText = typeof e.body === "string" ? e.body : "";
      console.error("Gemini API error:", status, errText);
      const msg = geminiHttpErrorMessage(status, errText);
      return res.status(status === 400 ? 400 : 502).json({ error: msg });
    }
    console.error("Simulate error:", err);
    return res.status(500).json({
      error: err instanceof Error ? err.message : "Internal server error",
    });
  }
}
