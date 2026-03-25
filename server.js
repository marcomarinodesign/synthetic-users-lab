import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, ".env.local") });
dotenv.config();
import express from "express";
import {
  flowPersonaSeed,
  runSimulateWithPhases,
  runSimulateWithPhasesObservable,
  fetchUrlContent,
  formatGeminiErrorForClient,
} from "./api/simulation-core.js";
import { validateSimulationRequest } from "./api/validate-simulation-request.js";

const app = express();
app.use(express.json());

const PORT = 3001;

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

  const parsed = validateSimulationRequest(req.body || {});
  if (!parsed.ok) {
    return res.status(400).json({ error: parsed.error });
  }
  const { persona, sourceType, flowInput, productContext, language, seed } = parsed.value;
  const baseSeed = seed !== undefined ? seed : flowPersonaSeed(flowInput, persona.id);

  try {
    const result = await runSimulateWithPhases({
      apiKey,
      persona,
      sourceType,
      flowInput,
      productContext,
      language,
      baseSeed,
    });
    return res.json({ ...result, personaId: persona.id });
  } catch (err) {
    if (err?.code === "OBJECTIVE_ANALYSIS_PARSE_FAILED") {
      return res.status(502).json({ error: "No se pudo analizar el flujo de forma objetiva. Reintenta." });
    }
    if (err?.code === "SIMULATION_EMPTY") {
      return res.status(502).json({ error: "Empty response from Gemini" });
    }
    if (err && typeof err === "object" && "status" in err) {
      const status = err.status;
      const errText = typeof err.body === "string" ? err.body : "";
      console.error("Gemini API error:", status, errText);
      const msg = formatGeminiErrorForClient(status, errText);
      return res.status(status === 400 ? 400 : 502).json({ error: msg });
    }
    console.error("Simulate error:", err);
    return res.status(500).json({ error: err.message || "Internal server error" });
  }
});

app.post("/api/simulate-stream", async (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    return res.status(400).json({
      error: "GEMINI_API_KEY no configurada. Añádela en .env.local (https://aistudio.google.com/app/apikey)",
    });
  }

  const parsed = validateSimulationRequest(req.body || {});
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

  const send = (event, data) => {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  try {
    const result = await runSimulateWithPhasesObservable({
      apiKey,
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
    return res.end();
  } catch (err) {
    if (err?.code === "OBJECTIVE_ANALYSIS_PARSE_FAILED") {
      send("error", { error: "No se pudo analizar el flujo de forma objetiva. Reintenta.", code: "OBJECTIVE_ANALYSIS_PARSE_FAILED" });
      send("done", { ok: false });
      return res.end();
    }
    if (err?.code === "SIMULATION_EMPTY") {
      send("error", { error: "Empty response from Gemini", code: "SIMULATION_EMPTY" });
      send("done", { ok: false });
      return res.end();
    }
    if (err && typeof err === "object" && "status" in err) {
      const status = err.status;
      const errText = typeof err.body === "string" ? err.body : "";
      const msg = formatGeminiErrorForClient(status, errText);
      send("error", { error: msg, code: "GEMINI_HTTP_ERROR", status: status === 400 ? 400 : 502 });
      send("done", { ok: false });
      return res.end();
    }
    send("error", { error: err?.message || "Internal server error", code: "INTERNAL_ERROR" });
    send("done", { ok: false });
    return res.end();
  }
});

app.listen(PORT, () => {
  console.log(`API server running at http://localhost:${PORT}`);
});
