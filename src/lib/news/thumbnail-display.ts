import type { PostTopic } from "@/generated/prisma/client";
import { getFallbackThumbnail } from "@/lib/news/default-thumbnails";

import { isHttpOrHttpsUrl } from "@/lib/news/image-url";

/** Unsplash는 직링크, http/https 외부 이미지는 서버 프록시(프로토콜 무관) */
export function getThumbnailDisplayUrl(
  thumbnail: string | null | undefined,
  sourceUrl?: string | null,
  topic?: PostTopic
): string | undefined {
  const trimmed = thumbnail?.trim();
  if (!trimmed || !isHttpOrHttpsUrl(trimmed)) return undefined;

  if (trimmed.includes("images.unsplash.com")) {
    return trimmed;
  }

  const params = new URLSearchParams({ url: trimmed });
  if (sourceUrl?.trim() && isHttpOrHttpsUrl(sourceUrl)) {
    params.set("source", sourceUrl.trim());
  }
  if (topic) params.set("topic", topic);
  return `/api/news/thumbnail?${params.toString()}`;
}

export function getFallbackDisplayUrl(topic: PostTopic = "KOREA"): string {
  return getFallbackThumbnail(topic);
}
