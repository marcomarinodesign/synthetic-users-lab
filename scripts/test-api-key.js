#!/usr/bin/env node
/**
 * Verifica que GEMINI_API_KEY funciona.
 * Ejecutar: node scripts/test-api-key.js
 */
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
dotenv.config({ path: join(root, ".env.local") });
dotenv.config({ path: join(root, ".env") });

const key = process.env.GEMINI_API_KEY?.trim();
if (!key) {
  console.error("❌ GEMINI_API_KEY no encontrada en .env.local");
  process.exit(1);
}

console.log("🔑 Key encontrada, longitud:", key.length);
console.log("📡 Probando Gemini API...");

const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";
const res = await fetch(url, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-goog-api-key": key,
  },
  body: JSON.stringify({
    contents: [{ parts: [{ text: "Di 'OK' en una palabra" }] }],
  }),
});

const data = await res.json();
if (res.ok) {
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  console.log("✅ API key válida. Respuesta:", text.slice(0, 50));
} else {
  console.error("❌ Error", res.status, data?.error?.message || JSON.stringify(data).slice(0, 200));
  process.exit(1);
}
