import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, ".env.local") });
dotenv.config();
import express from "express";
import { flowPersonaSeed, runSimulateWithPhases, fetchUrlContent } from "./api/simulation-core.js";
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
      let msg = `Gemini API error: ${status}`;
      try {
        const errJson = JSON.parse(errText);
        const geminiMsg = errJson?.error?.message || "";
        if (status === 400 && (geminiMsg.includes("API key") || geminiMsg.includes("invalid"))) {
          msg = "API key inválida o bloqueada. Crea una NUEVA key en https://aistudio.google.com/app/apikey (las keys expuestas en repos se bloquean automáticamente)";
        } else if (geminiMsg) {
          msg = geminiMsg;
        }
      } catch {}
      return res.status(status === 400 ? 400 : 502).json({ error: msg });
    }
    console.error("Simulate error:", err);
    return res.status(500).json({ error: err.message || "Internal server error" });
  }
});

app.listen(PORT, () => {
  console.log(`API server running at http://localhost:${PORT}`);
});
