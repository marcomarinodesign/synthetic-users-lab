import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  flowPersonaSeed,
  runSimulateWithPhases,
  runSimulateWithPhasesObservable,
  formatGeminiErrorForClient,
} from "./simulation-core.js";
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
      const msg = formatGeminiErrorForClient(status, errText);
      return res.status(status === 400 ? 400 : 502).json({ error: msg });
    }
    console.error("Simulate error:", err);
    return res.status(500).json({
      error: err instanceof Error ? err.message : "Internal server error",
    });
  }
}

export async function streamHandler(req: VercelRequest, res: VercelResponse) {
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

  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders?.();

  const send = (event: string, data: unknown) => {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  try {
    const result = await runSimulateWithPhasesObservable({
      apiKey: apiKey.trim(),
      persona,
      sourceType,
      flowInput,
      productContext,
      language,
      baseSeed,
      onPhaseStart: ({ phase }) => send("phase:start", { phase }),
      onPhaseDone: ({ phase }) => send("phase:done", { phase }),
    });
    send("result:final", { ...result, personaId: persona.id });
    send("done", { ok: true });
    res.end();
  } catch (err) {
    if (err && typeof err === "object" && "code" in err && (err as { code?: string }).code === "OBJECTIVE_ANALYSIS_PARSE_FAILED") {
      send("error", { error: "No se pudo analizar el flujo de forma objetiva. Reintenta.", code: "OBJECTIVE_ANALYSIS_PARSE_FAILED" });
      send("done", { ok: false });
      return res.end();
    }
    if (err && typeof err === "object" && "code" in err && (err as { code?: string }).code === "SIMULATION_EMPTY") {
      send("error", { error: "Empty response from Gemini", code: "SIMULATION_EMPTY" });
      send("done", { ok: false });
      return res.end();
    }
    if (err && typeof err === "object" && "status" in err) {
      const e = err as { status?: number; body?: string };
      const status = typeof e.status === "number" ? e.status : 502;
      const errText = typeof e.body === "string" ? e.body : "";
      const msg = formatGeminiErrorForClient(status, errText);
      send("error", { error: msg, code: "GEMINI_HTTP_ERROR", status: status === 400 ? 400 : 502 });
      send("done", { ok: false });
      return res.end();
    }
    send("error", {
      error: err instanceof Error ? err.message : "Internal server error",
      code: "INTERNAL_ERROR",
    });
    send("done", { ok: false });
    return res.end();
  }
}
