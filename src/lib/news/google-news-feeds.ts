import type { NewsFeedSource } from "@/lib/news/sources";

const GOOGLE_NEWS_RSS_BASE = "https://news.google.com/rss/search?q=";

function googleNewsRss(query: string): string {
  return `${GOOGLE_NEWS_RSS_BASE}${encodeURIComponent(query)}&hl=ko&gl=KR&ceid=KR:ko`;
}

/** Google 뉴스 RSS — 베트남+교민/진출/안전 */
export function googleNewsFeedsForKorea(): NewsFeedSource[] {
  return [
    {
      type: "rss",
      url: googleNewsRss("베트남 교민 when:2d"),
      sourceName: "Google 뉴스 · 베트남 교민",
      tier: "GENERAL",
    },
    {
      type: "rss",
      url: googleNewsRss("베트남 진출 when:2d"),
      sourceName: "Google 뉴스 · 베트남 진출",
      tier: "GENERAL",
    },
    {
      type: "rss",
      url: googleNewsRss("베트남 안전 when:2d"),
      sourceName: "Google 뉴스 · 베트남 안전",
      tier: "SAFETY_VISA",
    },
  ];
}
