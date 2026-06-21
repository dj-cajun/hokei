import type { PostTopic } from "@/generated/prisma/client";
import { log } from "@/lib/logger";
import type { RawNewsItem } from "@/lib/news/rss";
import type { NewsIngestTier } from "@/lib/news/news-ingest-tier";

export const LAODONG_KO_SITEMAP_URL = "https://ko.laodong.vn/sitemap.xml";

const USER_AGENT =
  "Mozilla/5.0 (compatible; HokeiNewsBot/1.0; +https://hokei.vn)";

function parseSitemapEntries(xml: string): Array<{
  link: string;
  title: string;
  publishedAt: Date;
}> {
  const out: Array<{ link: string; title: string; publishedAt: Date }> = [];
  const urlBlocks = xml.match(/<url>[\s\S]*?<\/url>/gi) ?? [];

  for (const block of urlBlocks) {
    const link = block.match(/<loc>([^<]+)<\/loc>/i)?.[1]?.trim();
    const title = block
      .match(/<news:title>([\s\S]*?)<\/news:title>/i)?.[1]
      ?.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/, "$1")
      .trim();
    const pubRaw =
      block.match(/<news:publication_date>([^<]+)<\/news:publication_date>/i)?.[1]
        ?.trim() ??
      block.match(/<lastmod>([^<]+)<\/lastmod>/i)?.[1]?.trim();

    if (!link?.startsWith("https://ko.laodong.vn/") || !title) continue;

    const publishedAt = pubRaw ? new Date(pubRaw) : new Date();
    if (Number.isNaN(publishedAt.getTime())) continue;

    out.push({ link, title, publishedAt });
  }

  return out;
}

/** ko.laodong.vn Google News sitemap — 한국어 기사 */
export async function fetchLaodongKoSitemapItems(
  topic: PostTopic,
  sourceName: string,
  maxPerFeed = 5,
  ingestTier?: NewsIngestTier
): Promise<RawNewsItem[]> {
  const cutoff = Date.now() - 48 * 60 * 60 * 1000;

  try {
    const res = await fetch(LAODONG_KO_SITEMAP_URL, {
      headers: { "User-Agent": USER_AGENT, Accept: "application/xml,text/xml" },
      cache: "no-store",
    });
    if (!res.ok) {
      log("error", "[laodong-ko] sitemap fetch failed", {
        status: res.status,
      });
      return [];
    }

    const xml = (await res.text()).slice(0, 2_000_000);
    return parseSitemapEntries(xml)
      .filter((item) => item.publishedAt.getTime() >= cutoff)
      .sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime())
      .slice(0, maxPerFeed)
      .map((item) => ({
        topic,
        title: item.title.slice(0, 300),
        description: item.title.slice(0, 2000),
        link: item.link,
        sourceName,
        publishedAt: item.publishedAt,
        ingestTier,
      }));
  } catch (error) {
    log("error", "[laodong-ko] sitemap error", { error: String(error) });
    return [];
  }
}
