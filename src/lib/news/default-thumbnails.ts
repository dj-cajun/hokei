import type { PostTopic } from "@/generated/prisma/client";

/**
 * 토픽별 대체 썸네일 — same-origin 정적 파일 (외부 CDN·Unsplash 404 방지)
 * 이미지 갱신: npm run news:seed-fallback-thumbnails
 */
const FALLBACK_PATH_BY_TOPIC: Record<PostTopic, string> = {
  KOREA: "/news/fallback/korea.jpg",
  TRAVEL: "/news/fallback/travel.jpg",
  VIETNAM_POLICY: "/news/fallback/vietnam-policy.jpg",
  TOURIST: "/news/fallback/tourist.jpg",
};

const FALLBACK_PATHS = new Set(Object.values(FALLBACK_PATH_BY_TOPIC));

export function getFallbackThumbnail(topic: PostTopic): string {
  return FALLBACK_PATH_BY_TOPIC[topic];
}

export function isStaticFallbackThumbnailPath(
  url: string | null | undefined
): boolean {
  const trimmed = url?.trim() ?? "";
  if (!trimmed) return false;
  const path = trimmed.split("?")[0] ?? trimmed;
  return FALLBACK_PATHS.has(path);
}

/** DB에 저장된 대체·레거시 URL (실제 기사 사진 아님) */
export function isFallbackThumbnailUrl(url: string | null | undefined): boolean {
  const trimmed = url?.trim() ?? "";
  if (!trimmed) return false;
  if (isStaticFallbackThumbnailPath(trimmed)) return true;
  return trimmed.includes("images.unsplash.com");
}

/** public/news/fallback/{filename} 절대 경로 (API·스크립트용) */
export function getStaticFallbackFilePath(topic: PostTopic): string {
  const rel = getFallbackThumbnail(topic).replace(/^\//, "");
  return `public/${rel}`;
}
