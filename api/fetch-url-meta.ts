import type { VercelRequest, VercelResponse } from "@vercel/node";
import { fetchUrlMetadataResult } from "./url-meta-core.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const body = req.body as { url?: unknown };
  const url = body?.url;
  if (typeof url !== "string" || !url.trim()) {
    return res.status(400).json({ error: "Missing url" });
  }

  try {
    const result = await fetchUrlMetadataResult(url.trim());
    return res.status(200).json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch metadata";
    return res.status(502).json({ error: message });
  }
}
