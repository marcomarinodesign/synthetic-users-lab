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
    return res.status(502).json({ error: err instanceof Error ? err.message : "Failed to fetch URL" });
  }
}
