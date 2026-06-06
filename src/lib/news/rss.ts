import Parser from "rss-parser";
import type { PostTopic } from "@/generated/prisma/client";
import { log } from "@/lib/logger";
import { decodeHtmlEntities } from "@/lib/news/decode-html-entities";
import { extractImageFromHtml } from "@/lib/news/image";
import type { NewsIngestTier } from "@/lib/news/news-ingest-tier";

export type RawNewsItem = {
  topic: PostTopic;
  title: string;
  description: string;
  link: string;
  sourceName: string;
  publishedAt: Date;
  thumbnail?: string;
  ingestTier?: NewsIngestTier;
};

type MediaNode = { $?: { url?: string; type?: string; medium?: string } };

const parser = new Parser({
  timeout: 15000,
  headers: {
    "User-Agent": "HokeiNewsBot/1.0 (+https://hokei.vn)",
  },
  customFields: {
    item: [
      ["media:content", "mediaContent", { keepArray: true }],
      ["media:thumbnail", "mediaThumbnail", { keepArray: true }],
    ],
  },
});

function stripHtml(html: string): string {
  return decodeHtmlEntities(
    html
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
  );
}

function parseDate(item: Parser.Item): Date {
  const raw = item.isoDate ?? item.pubDate;
  if (!raw) return new Date();
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? new Date() : d;
}

function extractImage(item: Parser.Item): string | undefined {
  const enc = item.enclosure;
  if (enc?.url && enc.type?.startsWith("image")) return enc.url;

  const extended = item as Parser.Item & {
    mediaContent?: MediaNode[];
    mediaThumbnail?: MediaNode[];
    "media:content"?: MediaNode | MediaNode[];
    "media:thumbnail"?: MediaNode | MediaNode[];
  };

  const mediaNodes: MediaNode[] = [
    ...(Array.isArray(extended.mediaContent) ? extended.mediaContent : []),
    ...(Array.isArray(extended.mediaThumbnail) ? extended.mediaThumbnail : []),
  ];

  const legacyMedia = extended["media:content"] ?? extended["media:thumbnail"];
  if (legacyMedia) {
    mediaNodes.push(...(Array.isArray(legacyMedia) ? legacyMedia : [legacyMedia]));
  }

  for (const node of mediaNodes) {
    const url = node?.$?.url;
    const type = node?.$?.type ?? "";
    const medium = node?.$?.medium ?? "";
    if (
      url &&
      (type.startsWith("image") || medium === "image" || /\.(jpe?g|png|webp)/i.test(url))
    ) {
      return url;
    }
  }

  const html = [item.content, item.summary, item.contentSnippet]
    .filter(Boolean)
    .join(" ");
  return extractImageFromHtml(html);
}

function normalizeFeedUrl(url: string): string {
  try {
    return new URL(url).href;
  } catch {
    return encodeURI(url);
  }
}

export async function fetchFeedItems(
  url: string,
  topic: PostTopic,
  sourceName: string,
  maxPerFeed = 5,
  ingestTier?: NewsIngestTier
): Promise<RawNewsItem[]> {
  const feedUrl = normalizeFeedUrl(url);
  try {
    const feed = await parser.parseURL(feedUrl);
    const cutoff = Date.now() - 48 * 60 * 60 * 1000;

    return (feed.items ?? [])
      .slice(0, maxPerFeed)
      .map((item) => {
        const title = stripHtml(item.title ?? "").slice(0, 300);
        const rawContent = item.content ?? item.summary ?? "";
        const description = stripHtml(
          item.contentSnippet ?? rawContent ?? ""
        ).slice(0, 2000);
        const link = item.link ?? item.guid ?? "";
        const publishedAt = parseDate(item);

        return {
          topic,
          title,
          description,
          link,
          sourceName: feed.title ?? sourceName,
          publishedAt,
          thumbnail:
            extractImage(item) ?? extractImageFromHtml(String(rawContent)),
          ingestTier,
        };
      })
      .filter(
        (item) =>
          item.title.length > 4 &&
          item.link.startsWith("http") &&
          item.publishedAt.getTime() >= cutoff
      );
  } catch (error) {
    log("error", "[rss] fetch failed", { url, error: String(error) });
    return [];
  }
}
