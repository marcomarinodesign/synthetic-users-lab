import type { VercelRequest, VercelResponse } from "@vercel/node";
import { fetchUrlContent } from "./simulation-core.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { url } = req.body as { url?: string };
  if (!url) return res.status(400).json({ error: "Missing url" });

  try {
    const content = await fetchUrlContent(url);
    return res.status(200).json({ content });
  } catch (err) {
    const raw = err instanceof Error ? err.message : "Failed to fetch URL";
    const isBlocked = /HTTP 40[13]/.test(raw);
    const isTimeout = /timeout|abort/i.test(raw);
    const userMessage = isBlocked
      ? "El sitio web bloqueó el acceso automático (protección anti-bot activa). Por favor, copia y pega el contenido de la página en el campo de descripción para continuar."
      : isTimeout
        ? "El sitio web tardó demasiado en responder. Comprueba que la URL es accesible o describe el producto manualmente."
        : raw;
    return res.status(502).json({ error: userMessage, blocked: isBlocked, timeout: isTimeout });
  }
}
