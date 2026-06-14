import type { PostTopic } from "@/lib/post-topic";
import {
  getFallbackThumbnail,
  isFallbackThumbnailUrl,
  isStaticFallbackThumbnailPath,
} from "@/lib/news/default-thumbnails";
import { isHttpOrHttpsUrl } from "@/lib/news/image-url";

/**
 * 브라우저에 노출할 썸네일 URL — 외부 https 직링크 금지
 * 1) 정적 폴백(/news/fallback/…)
 * 2) 그 외 http(s) → same-origin 프록시
 */
export function getThumbnailDisplayUrl(
  thumbnail: string | null | undefined,
  sourceUrl?: string | null,
  topic?: PostTopic
): string {
  const resolvedTopic = topic ?? "KOREA";
  const fallback = getFallbackThumbnail(resolvedTopic);
  const trimmed = thumbnail?.trim();

  if (!trimmed) {
    return fallback;
  }

  if (isStaticFallbackThumbnailPath(trimmed)) {
    return trimmed.split("?")[0] ?? trimmed;
  }

  if (isFallbackThumbnailUrl(trimmed)) {
    return fallback;
  }

  if (!isHttpOrHttpsUrl(trimmed)) {
    return fallback;
  }

  const params = new URLSearchParams({ url: trimmed });
  if (sourceUrl?.trim() && isHttpOrHttpsUrl(sourceUrl)) {
    params.set("source", sourceUrl.trim());
  }
  params.set("topic", resolvedTopic);
  return `/api/news/thumbnail?${params.toString()}`;
}

export function getFallbackDisplayUrl(topic: PostTopic = "KOREA"): string {
  return getFallbackThumbnail(topic);
}
