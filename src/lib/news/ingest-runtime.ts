import { isNaverNewsConfigured } from "@/lib/news/naver-news";
import {
  isNaverRequestsScraperAvailable,
  isNaverScraperAvailable,
} from "@/lib/news/naver-scrape";
import { isGeminiConfigured } from "@/lib/ai/gemini";
import { isZaiConfigured } from "@/lib/ai/zai";

/**
 * 수집 소스 모드
 *
 * - **프로덕션(Vercel)**: NAVER_CLIENT_ID/SECRET 있으면 REST API + RSS 혼합 (Playwright 불가)
 * - **프로덕션(Vercel), 네이버 없음**: RSS 우회만
 * - **로컬**: 네이버 API 또는 Python 스크래퍼(requests/Playwright) + RSS 혼합
 */
export async function resolveIngestRssOnly(): Promise<{
  rssOnly: boolean;
  naverConfigured: boolean;
  naverScraperOk: boolean;
  reason: string;
}> {
  const naverConfigured = isNaverNewsConfigured();
  const naverScraperOk =
    (await isNaverRequestsScraperAvailable()) ||
    (await isNaverScraperAvailable());

  if (process.env.INGEST_RSS_ONLY === "1") {
    return {
      rssOnly: true,
      naverConfigured,
      naverScraperOk,
      reason: "INGEST_RSS_ONLY=1",
    };
  }
  if (process.env.INGEST_RSS_ONLY === "0") {
    return {
      rssOnly: false,
      naverConfigured,
      naverScraperOk,
      reason: "INGEST_RSS_ONLY=0 (로컬 전용)",
    };
  }

  if (process.env.VERCEL === "1") {
    if (naverConfigured) {
      return {
        rssOnly: false,
        naverConfigured,
        naverScraperOk,
        reason: "vercel-naver-api (REST + RSS, no Playwright)",
      };
    }
    return {
      rssOnly: true,
      naverConfigured,
      naverScraperOk,
      reason: "vercel-rss-only (no naver keys)",
    };
  }

  return {
    rssOnly: false,
    naverConfigured,
    naverScraperOk,
    reason: "local-default (naver api/scraper + rss)",
  };
}

export function hasTranslationForIngest(): boolean {
  return (
    isGeminiConfigured() ||
    isZaiConfigured() ||
    Boolean(process.env.GOOGLE_TRANSLATE_API_KEY?.trim())
  );
}

/** 프로덕션 수집 가능 여부 (Cron 2회 연속 0건 방지 점검용) */
export async function assessIngestReadiness(): Promise<{
  ok: boolean;
  issues: string[];
  rssOnly: boolean;
  translationOk: boolean;
}> {
  const { rssOnly, naverConfigured, naverScraperOk, reason } =
    await resolveIngestRssOnly();
  const translationOk = hasTranslationForIngest();
  const issues: string[] = [];

  if (!process.env.CRON_SECRET?.trim()) {
    issues.push("CRON_SECRET 없음 — Vercel Cron 401");
  }
  if (!naverConfigured && !naverScraperOk && !rssOnly) {
    issues.push("네이버 API·스크래퍼 없고 RSS 모드도 아님");
  }
  if (rssOnly && !translationOk) {
    issues.push(
      "RSS-only 모드인데 GEMINI_API_KEY/ZAI_API_KEY/GOOGLE_TRANSLATE_API_KEY 없음"
    );
  }
  if (rssOnly) {
    issues.push(`RSS 모드: ${reason} (번역 키 ${translationOk ? "OK" : "없음"})`);
  }

  return {
    ok: issues.filter((m) => !m.startsWith("RSS 모드:")).length === 0,
    issues,
    rssOnly,
    translationOk,
  };
}
