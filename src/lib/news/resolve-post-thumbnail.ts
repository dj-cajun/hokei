import type { PostTopic } from "@/generated/prisma/client";
import {
  getFallbackThumbnail,
  isFallbackThumbnailUrl,
} from "@/lib/news/default-thumbnails";
import {
  normalizeStoredThumbnailUrl,
  resolveNewsThumbnailWithRetry,
  verifyImageAccessibleWithRetry,
} from "@/lib/news/image";
import {
  isNewsThumbnailBlobUrl,
  persistNewsThumbnailToBlob,
} from "@/lib/news/persist-thumbnail-blob";

export { isFallbackThumbnailUrl };

/** URL 정규화 → Blob 복사(가능 시) → 실패 시 원본 CDN URL */
async function finalizeNewsThumbnail(
  url: string | undefined,
  articleUrl: string
): Promise<string | undefined> {
  if (!url?.trim()) return undefined;
  const trimmed = url.trim();
  if (isNewsThumbnailBlobUrl(trimmed)) return trimmed;

  const normalized = await normalizeStoredThumbnailUrl(trimmed, articleUrl);
  if (!normalized) return undefined;
  if (isNewsThumbnailBlobUrl(normalized)) return normalized;

  const blobUrl = await persistNewsThumbnailToBlob(normalized, articleUrl);
  return blobUrl ?? normalized;
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
 * 1) 기사·RSS·og:image 등 실제 이미지 URL 확보
 * 2) BLOB_READ_WRITE_TOKEN 있으면 Vercel Blob에 복사 (우리 CDN URL)
 * 3) Blob 실패 시 원본 CDN URL 저장
 * 4) 없음 → 토픽별 정적 폴백(/news/fallback/…)
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
    const finalized = await finalizeNewsThumbnail(candidate, link);
    if (finalized) return finalized;
  }

  const resolved = await resolveNewsThumbnailWithRetry(link, htmlSources);
  if (resolved) {
    const finalized = await finalizeNewsThumbnail(resolved, link);
    if (finalized) return finalized;
  }

  return getFallbackThumbnail(topic);
}

/** DB 썸네일이 실제 기사 이미지로 쓸 수 있는지 */
export async function isWorkingArticleThumbnail(
  thumbnail: string | null | undefined,
  sourceUrl: string
): Promise<boolean> {
  if (!thumbnail?.trim() || isFallbackThumbnailUrl(thumbnail)) return false;
  const trimmed = thumbnail.trim();
  if (isNewsThumbnailBlobUrl(trimmed)) return true;
  if (await verifyImageAccessibleWithRetry(trimmed, sourceUrl)) return true;
  return false;
}
