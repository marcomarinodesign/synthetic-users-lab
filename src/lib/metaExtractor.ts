/**
 * Product-context auto-fill: delegates to same-origin `/api/fetch-url-meta`
 * (GitHub README + Jina Reader on the server) so WAF-protected sites work in production.
 */

export type ExtractedFieldId = "product" | "description" | "mainHeading" | "keySections" | "keywords";

export interface FetchMetadataResult {
  text: string;
  extractedFields: readonly ExtractedFieldId[];
}

export class MetadataFetchError extends Error {
  readonly code = "METADATA_FETCH" as const;
  constructor(message = "Failed to fetch page metadata") {
    super(message);
    this.name = "MetadataFetchError";
  }
}

export function isValidHttpUrl(raw: string): boolean {
  const s = raw.trim();
  if (!s.startsWith("http://") && !s.startsWith("https://")) return false;
  try {
    const u = new URL(s);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function isExtractedFieldId(v: unknown): v is ExtractedFieldId {
  return (
    v === "product" ||
    v === "description" ||
    v === "mainHeading" ||
    v === "keySections" ||
    v === "keywords"
  );
}

/**
 * In dev, call the Express API on :3001 directly (avoids a stale Vite proxy target).
 * In production, same-origin `/api/...` (e.g. Vercel).
 */
export function resolveFetchUrlMetaUrl(): string {
  if (import.meta.env.PROD) {
    return "/api/fetch-url-meta";
  }
  if (typeof window === "undefined") {
    return "/api/fetch-url-meta";
  }
  const { protocol, hostname } = window.location;
  const host = hostname === "127.0.0.1" ? "localhost" : hostname;
  return `${protocol}//${host}:3001/api/fetch-url-meta`;
}

const STALE_API_DEV_MESSAGE =
  "Restart dev: stop the terminal (Ctrl+C), then run npm run dev again so the API on port 3001 includes the latest routes.";

/**
 * Fetches metadata and returns formatted product-context text plus field ids for UI chips.
 */
export async function fetchMetadataResult(url: string): Promise<FetchMetadataResult> {
  const trimmed = url.trim();
  if (!isValidHttpUrl(trimmed)) {
    throw new MetadataFetchError("Invalid URL");
  }

  const endpoint = resolveFetchUrlMetaUrl();
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ url: trimmed }),
  });

  const contentType = res.headers.get("content-type") ?? "";
  if (contentType.includes("text/html")) {
    throw new MetadataFetchError(import.meta.env.DEV ? STALE_API_DEV_MESSAGE : undefined);
  }

  const raw: unknown = await res.json().catch(() => null);

  if (!res.ok) {
    const msg =
      raw &&
      typeof raw === "object" &&
      "error" in raw &&
      typeof (raw as { error: unknown }).error === "string"
        ? (raw as { error: string }).error
        : undefined;
    throw new MetadataFetchError(msg);
  }

  if (!raw || typeof raw !== "object") {
    throw new MetadataFetchError();
  }

  const obj = raw as { text?: unknown; extractedFields?: unknown };
  if (typeof obj.text !== "string" || !Array.isArray(obj.extractedFields)) {
    throw new MetadataFetchError();
  }

  const extractedFields = obj.extractedFields.filter(isExtractedFieldId);
  return { text: obj.text, extractedFields };
}

/** Returns only the formatted block string. */
export async function fetchMetadata(url: string): Promise<string> {
  const r = await fetchMetadataResult(url);
  return r.text;
}
