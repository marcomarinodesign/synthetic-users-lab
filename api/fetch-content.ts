import type { VercelRequest, VercelResponse } from "@vercel/node";

async function fetchUrlContent(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; SyntheticUsersBot/1.0)" },
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status} al obtener ${url}`);
  const html = await response.text();
  const text = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, " ")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 8000);
  return text;
}

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
