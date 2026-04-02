/**
 * Client-only metadata extraction for auto-filling product context from a URL.
 * Uses GitHub API + allorigins + DOMParser (browser).
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

function parseGitHubOwnerRepo(urlString: string): { owner: string; repo: string } | null {
  let u: URL;
  try {
    u = new URL(urlString.trim());
  } catch {
    return null;
  }
  if (u.hostname !== "github.com") return null;
  const parts = u.pathname.split("/").filter(Boolean);
  if (parts.length < 2) return null;
  return { owner: parts[0], repo: parts[1] };
}

async function fetchGithubReadmeRaw(owner: string, repo: string): Promise<string> {
  const res = await fetch(`https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/readme`, {
    headers: { Accept: "application/vnd.github.raw" },
  });
  if (!res.ok) throw new Error("readme_failed");
  return await res.text();
}

async function fetchHtmlViaAllOrigins(url: string): Promise<string> {
  const endpoint = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
  const res = await fetch(endpoint);
  if (!res.ok) throw new MetadataFetchError();
  const data: unknown = await res.json();
  if (!data || typeof data !== "object" || !("contents" in data)) throw new MetadataFetchError();
  const contents = (data as { contents: unknown }).contents;
  if (typeof contents !== "string") throw new MetadataFetchError();
  return contents;
}

function metaContent(doc: Document, attr: "property" | "name", value: string): string {
  const el = doc.querySelector(`meta[${attr}="${value}"]`);
  const c = el?.getAttribute("content");
  return c?.trim() ?? "";
}

function firstNonEmpty(...vals: string[]): string {
  for (const v of vals) {
    const t = v.trim();
    if (t) return t;
  }
  return "";
}

function normalizeForCompare(s: string): string {
  return s.trim().replace(/\s+/g, " ").toLowerCase();
}

interface HtmlParts {
  productLine: string;
  resolvedTitle: string;
  description: string;
  h1: string;
  h2s: string[];
  keywords: string;
}

function extractHtmlParts(html: string): HtmlParts {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  const ogTitle = metaContent(doc, "property", "og:title");
  const twitterTitle = metaContent(doc, "name", "twitter:title");
  const titleTag = doc.querySelector("title")?.textContent?.trim() ?? "";
  const resolvedTitle = firstNonEmpty(ogTitle, twitterTitle, titleTag);

  const siteName = metaContent(doc, "property", "og:site_name");
  const productLine = firstNonEmpty(siteName, resolvedTitle);

  const description = firstNonEmpty(
    metaContent(doc, "property", "og:description"),
    metaContent(doc, "name", "description"),
    metaContent(doc, "name", "twitter:description")
  );

  const keywords = metaContent(doc, "name", "keywords");

  const h1El = doc.querySelector("h1");
  const h1 = h1El?.textContent?.trim() ?? "";

  const h2s = [...doc.querySelectorAll("h2")]
    .slice(0, 3)
    .map((el) => el.textContent?.trim() ?? "")
    .filter((t) => t.length > 0);

  return { productLine, resolvedTitle, description, h1, h2s, keywords };
}

function buildBlockFromHtmlParts(p: HtmlParts): FetchMetadataResult {
  const lines: string[] = [];
  const fields: ExtractedFieldId[] = [];

  if (p.productLine) {
    lines.push(`Product: ${p.productLine}`);
    fields.push("product");
  }
  if (p.description) {
    lines.push(`Description: ${p.description}`);
    fields.push("description");
  }
  if (p.h1 && normalizeForCompare(p.h1) !== normalizeForCompare(p.resolvedTitle)) {
    lines.push(`Main heading: ${p.h1}`);
    fields.push("mainHeading");
  }
  if (p.h2s.length > 0) {
    lines.push(`Key sections: ${p.h2s.join(", ")}`);
    fields.push("keySections");
  }
  if (p.keywords) {
    lines.push(`Keywords: ${p.keywords}`);
    fields.push("keywords");
  }

  const text = lines.join("\n");
  if (!text.trim()) throw new MetadataFetchError();
  return { text, extractedFields: fields };
}

async function tryGithubReadme(url: string, owner: string, repo: string): Promise<FetchMetadataResult | null> {
  try {
    const readme = await fetchGithubReadmeRaw(owner, repo);
    const desc = readme.trim().slice(0, 500);
    const lines: string[] = [];
    const fields: ExtractedFieldId[] = [];
    lines.push(`Product: ${repo}`);
    fields.push("product");
    if (desc) {
      lines.push(`Description: ${desc}`);
      fields.push("description");
    }
    return { text: lines.join("\n"), extractedFields: fields };
  } catch {
    return null;
  }
}

/**
 * Fetches metadata and returns formatted product-context text plus field ids for UI chips.
 */
export async function fetchMetadataResult(url: string): Promise<FetchMetadataResult> {
  const trimmed = url.trim();
  if (!isValidHttpUrl(trimmed)) {
    throw new MetadataFetchError("Invalid URL");
  }

  const gh = parseGitHubOwnerRepo(trimmed);
  if (gh) {
    const fromReadme = await tryGithubReadme(trimmed, gh.owner, gh.repo);
    if (fromReadme) return fromReadme;
  }

  const html = await fetchHtmlViaAllOrigins(trimmed);
  const parts = extractHtmlParts(html);
  return buildBlockFromHtmlParts(parts);
}

/** Spec-shaped helper: returns only the formatted block string. */
export async function fetchMetadata(url: string): Promise<string> {
  const r = await fetchMetadataResult(url);
  return r.text;
}
