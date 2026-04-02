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

/**
 * @param {string} url
 * @returns {Promise<{ text: string, extractedFields: ExtractedFieldId[] }>}
 */
export async function fetchUrlMetadataResult(url) {
  const trimmed = url.trim();
  if (!isValidHttpUrl(trimmed)) {
    throw new MetadataFetchError("Invalid URL");
  }

  const gh = parseGitHubOwnerRepo(trimmed);
  if (gh) {
    const fromReadme = await tryGithubReadme(trimmed, gh.owner, gh.repo);
    if (fromReadme) return fromReadme;
  }

  const jinaUrl = `https://r.jina.ai/${trimmed}`;
  const ac = new AbortController();
  const tid = setTimeout(() => ac.abort(), JINA_TIMEOUT_MS);
  try {
    const res = await fetch(jinaUrl, {
      signal: ac.signal,
      headers: {
        Accept: "text/plain",
        "User-Agent":
          "Mozilla/5.0 (compatible; SyntheticUsersLab/1.0; +https://github.com/marcomarinodesign/synthetic-users-lab)",
      },
    });
    if (!res.ok) throw new MetadataFetchError();
    const text = await res.text();
    const head = text.trim().slice(0, 80);
    if (!text || text.length < 12) throw new MetadataFetchError();
    if (/^error code:/i.test(head)) throw new MetadataFetchError();
    return parseJinaReaderToResult(text);
  } catch (e) {
    if (e instanceof MetadataFetchError) throw e;
    throw new MetadataFetchError();
  } finally {
    clearTimeout(tid);
  }
}
