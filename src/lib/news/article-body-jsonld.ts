import { decodeHtmlEntities } from "@/lib/news/decode-html-entities";

function stripTags(html: string): string {
  return decodeHtmlEntities(
    html
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n\n")
      .replace(/<[^>]+>/g, "")
  )
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]+/g, " ")
    .trim();
}

function collectJsonLdNodes(raw: unknown, out: Record<string, unknown>[]): void {
  if (!raw) return;
  if (Array.isArray(raw)) {
    for (const item of raw) collectJsonLdNodes(item, out);
    return;
  }
  if (typeof raw !== "object") return;
  const obj = raw as Record<string, unknown>;
  if (obj["@graph"] && Array.isArray(obj["@graph"])) {
    collectJsonLdNodes(obj["@graph"], out);
  }
  out.push(obj);
}

function isNewsArticleType(type: unknown): boolean {
  if (typeof type === "string") {
    return /NewsArticle|Article|ReportageNewsArticle/i.test(type);
  }
  if (Array.isArray(type)) {
    return type.some((t) => isNewsArticleType(t));
  }
  return false;
}

/** application/ld+json NewsArticle articleBody (HTML·텍스트) */
export function extractArticleBodyFromJsonLd(html: string): string {
  const re =
    /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;
  const nodes: Record<string, unknown>[] = [];

  while ((match = re.exec(html)) !== null) {
    try {
      collectJsonLdNodes(JSON.parse(match[1]!.trim()), nodes);
    } catch {
      /* ignore malformed JSON-LD */
    }
  }

  let best = "";
  for (const node of nodes) {
    if (!isNewsArticleType(node["@type"])) continue;
    const body = node.articleBody;
    if (typeof body !== "string" || !body.trim()) continue;
    const text = body.includes("<") ? stripTags(body) : body.trim();
    if (text.length > best.length) best = text;
  }
  return best;
}
