import type { PostTopic } from "@/generated/prisma/client";
import { getFallbackThumbnail } from "@/lib/news/default-thumbnails";
import {
  normalizeStoredThumbnailUrl,
  resolveNewsThumbnailWithRetry,
  verifyImageAccessibleWithRetry,
} from "@/lib/news/image";

/** Unsplash 대체 이미지 — 기사 사진을 못 구했을 때만 사용 */
export function isFallbackThumbnailUrl(url: string | null | undefined): boolean {
  const trimmed = url?.trim() ?? "";
  return trimmed.includes("images.unsplash.com");
}

async function normalizeIfAccessible(
  url: string | undefined,
  articleUrl: string
): Promise<string | undefined> {
  if (!url?.trim()) return undefined;
  return normalizeStoredThumbnailUrl(url.trim(), articleUrl);
}

export type ResolvePostThumbnailInput = {
  topic: PostTopic;
  link: string;
  /** RSS·네이버 요약 HTML */
  rssDescription?: string;
  /** RSS media:thumbnail 등 */
  rssThumbnail?: string;
  /** Playwright/HTML 스크래핑 대표 이미지 */
  scrapedImg?: string | null;
  /** DB에 이미 있는 URL (재검증·정규화) */
  existingThumbnail?: string | null;
};

/**
 * 자동 뉴스 썸네일 정책
 * 1) 기사·RSS·og:image 등 실제 이미지 URL을 우선 연결
 * 2) 접근 불가·없음 → 토픽별 대체(Unsplash)
 */
export async function resolveAutomatedNewsThumbnail(
  input: ResolvePostThumbnailInput
): Promise<string> {
  const { topic, link, rssDescription, rssThumbnail, scrapedImg, existingThumbnail } =
    input;

  const htmlSources = [rssDescription].filter(
    (s): s is string => Boolean(s?.trim())
  );

  const orderedCandidates = [
    scrapedImg,
    rssThumbnail,
    !isFallbackThumbnailUrl(existingThumbnail) ? existingThumbnail : undefined,
  ].filter((u): u is string => Boolean(u?.trim()));

  for (const candidate of orderedCandidates) {
    const normalized = await normalizeIfAccessible(candidate, link);
    if (normalized) return normalized;
  }

  const resolved = await resolveNewsThumbnailWithRetry(link, htmlSources);
  if (resolved) {
    const normalized = await normalizeIfAccessible(resolved, link);
    if (normalized) return normalized;
  }

  return getFallbackThumbnail(topic);
}

/** DB 썸네일이 실제 기사 이미지로 쓸 수 있는지 */
export async function isWorkingArticleThumbnail(
  thumbnail: string | null | undefined,
  sourceUrl: string
): Promise<boolean> {
  if (!thumbnail?.trim() || isFallbackThumbnailUrl(thumbnail)) return false;
  return verifyImageAccessibleWithRetry(thumbnail.trim(), sourceUrl);
}
