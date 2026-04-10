/**
 * Server-side URL metadata for product-context auto-fill.
 * Uses GitHub API for repos; Jina Reader (r.jina.ai) for generic URLs so WAF-protected
 * sites work (allorigins/datacenter IPs often get blocked).
 */

/** @typedef {"product"|"description"|"mainHeading"|"keySections"|"keywords"} ExtractedFieldId */

export class MetadataFetchError extends Error {
  constructor(message = "Failed to fetch page metadata") {
    super(message);
    this.name = "MetadataFetchError";
    this.code = "METADATA_FETCH";
  }
}

export function isValidHttpUrl(raw) {
  const s = String(raw).trim();
  if (!s.startsWith("http://") && !s.startsWith("https://")) return false;
  try {
    const u = new URL(s);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function parseGitHubOwnerRepo(urlString) {
  let u;
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

async function fetchGithubReadmeRaw(owner, repo) {
  const res = await fetch(
    `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/readme`,
    { headers: { Accept: "application/vnd.github.raw" } }
  );
  if (!res.ok) throw new Error("readme_failed");
  return await res.text();
}

function normalizeForCompare(s) {
  return String(s)
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

/**
 * @param {string} raw
 * @returns {{ text: string, extractedFields: ExtractedFieldId[] }}
 */
export function parseJinaReaderToResult(raw) {
  const titleMatch = raw.match(/^Title:\s*(.+)$/m);
  const title = titleMatch?.[1]?.trim() ?? "";

  const mdIdx = raw.indexOf("Markdown Content:");
  let md = mdIdx >= 0 ? raw.slice(mdIdx + "Markdown Content:".length).trim() : raw.trim();

  const firstH1Match = md.match(/^#\s+(.+)$/m);
  const h1 = firstH1Match?.[1]?.trim() ?? "";

  /** @type {string[]} */
  const h2s = [];
  for (const m of md.matchAll(/^##\s+(.+)$/gm)) {
    if (h2s.length < 3) h2s.push(m[1].trim());
  }

  let plain = md
    .replace(/^#{1,6}\s+.+$/gm, "\n")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
  const description = plain.slice(0, 500);

  const resolvedTitle = title || h1;
  const productLine = title || h1;

  const lines = [];
  /** @type {ExtractedFieldId[]} */
  const fields = [];

  if (productLine) {
    lines.push(`Product: ${productLine}`);
    fields.push("product");
  }
  if (description) {
    lines.push(`Description: ${description}`);
    fields.push("description");
  }
  if (h1 && normalizeForCompare(h1) !== normalizeForCompare(resolvedTitle)) {
    lines.push(`Main heading: ${h1}`);
    fields.push("mainHeading");
  }
  if (h2s.length > 0) {
    lines.push(`Key sections: ${h2s.join(", ")}`);
    fields.push("keySections");
  }

  const text = lines.join("\n");
  if (!text.trim()) throw new MetadataFetchError("Empty metadata");
  return { text, extractedFields: fields };
}

async function tryGithubReadme(_url, owner, repo) {
  try {
    const readme = await fetchGithubReadmeRaw(owner, repo);
    const desc = readme.trim().slice(0, 500);
    const lines = [];
    /** @type {ExtractedFieldId[]} */
    const fields = [];
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

const JINA_TIMEOUT_MS = 28_000;
const CACHE_TIMEOUT_MS = 15_000;

/**
 * Fetches a URL via Jina Reader proxy, which handles WAF-protected sites.
 * @param {string} trimmed
 * @returns {Promise<{ text: string, extractedFields: ExtractedFieldId[] } | null>}
 */
async function tryJinaReader(trimmed) {
  const jinaUrl = `https://r.jina.ai/${trimmed}`;
  const ac = new AbortController();
  const tid = setTimeout(() => ac.abort(), JINA_TIMEOUT_MS);
  try {
    const res = await fetch(jinaUrl, {
      signal: ac.signal,
      headers: {
        Accept: "text/plain",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      },
    });
    if (!res.ok) return null;
    const text = await res.text();
    const head = text.trim().slice(0, 80);
    if (!text || text.length < 12) return null;
    if (/^error code:/i.test(head)) return null;
    return parseJinaReaderToResult(text);
  } catch {
    return null;
  } finally {
    clearTimeout(tid);
  }
}

/**
 * Tries to fetch a cached version from Google Cache.
 * @param {string} trimmed
 * @returns {Promise<{ text: string, extractedFields: ExtractedFieldId[] } | null>}
 */
async function tryGoogleCache(trimmed) {
  const cacheUrl = `https://webcache.googleusercontent.com/search?q=cache:${encodeURIComponent(trimmed)}&hl=es`;
  const ac = new AbortController();
  const tid = setTimeout(() => ac.abort(), CACHE_TIMEOUT_MS);
  try {
    const res = await fetch(cacheUrl, {
      signal: ac.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,*/*;q=0.8",
        "Accept-Language": "es-ES,es;q=0.9,en;q=0.8",
      },
    });
    if (!res.ok) return null;
    const html = await res.text();
    if (html.length < 200) return null;

    // Strip scripts/styles and extract plain text
    const plain = html
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
      .slice(0, 500);

    if (!plain) return null;
    return {
      text: `Description: ${plain}`,
      extractedFields: /** @type {ExtractedFieldId[]} */ (["description"]),
    };
  } catch {
    return null;
  } finally {
    clearTimeout(tid);
  }
}

/**
 * Tries to fetch the latest snapshot from Wayback Machine (archive.org).
 * @param {string} trimmed
 * @returns {Promise<{ text: string, extractedFields: ExtractedFieldId[] } | null>}
 */
async function tryWaybackMachine(trimmed) {
  const ac = new AbortController();
  const tid = setTimeout(() => ac.abort(), CACHE_TIMEOUT_MS);
  try {
    // First, get the latest snapshot URL from the CDX API
    const cdxUrl = `https://archive.org/wayback/available?url=${encodeURIComponent(trimmed)}`;
    const cdxRes = await fetch(cdxUrl, { signal: ac.signal });
    if (!cdxRes.ok) return null;
    const cdxData = await cdxRes.json();
    const snapshotUrl = cdxData?.archived_snapshots?.closest?.url;
    if (!snapshotUrl) return null;

    const snapRes = await fetch(snapshotUrl, {
      signal: ac.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,*/*;q=0.8",
      },
    });
    if (!snapRes.ok) return null;
    const html = await snapRes.text();
    if (html.length < 200) return null;

    const plain = html
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
      .slice(0, 500);

    if (!plain) return null;
    return {
      text: `Description: ${plain}`,
      extractedFields: /** @type {ExtractedFieldId[]} */ (["description"]),
    };
  } catch {
    return null;
  } finally {
    clearTimeout(tid);
  }
}

/**
 * @param {string} url
 * @returns {Promise<{ text: string, extractedFields: ExtractedFieldId[] }>}
 */
export async function fetchUrlMetadataResult(url) {
  const trimmed = url.trim();
  if (!isValidHttpUrl(trimmed)) {
    throw new MetadataFetchError("Invalid URL");
  }

  // 1. GitHub repos → README via GitHub API
  const gh = parseGitHubOwnerRepo(trimmed);
  if (gh) {
    const fromReadme = await tryGithubReadme(trimmed, gh.owner, gh.repo);
    if (fromReadme) return fromReadme;
  }

  // 2. Jina Reader proxy (handles many WAF-protected sites)
  const fromJina = await tryJinaReader(trimmed);
  if (fromJina) return fromJina;

  // 3. Google Cache (works when origin blocks bots but Google has a cached copy)
  const fromGoogle = await tryGoogleCache(trimmed);
  if (fromGoogle) return fromGoogle;

  // 4. Wayback Machine / Internet Archive
  const fromWayback = await tryWaybackMachine(trimmed);
  if (fromWayback) return fromWayback;

  // All strategies exhausted
  throw new MetadataFetchError(
    "No se pudo acceder al sitio web. Puede estar protegido por WAF/Cloudflare o no tener versión en caché. Por favor, describe el producto manualmente."
  );
}
