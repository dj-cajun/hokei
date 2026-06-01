import type { PostTopic } from "@/generated/prisma/client";

/** og:image를 못 가져올 때 피드용 대체 이미지 */
const FALLBACK_BY_TOPIC: Record<PostTopic, string> = {
  KOREA:
    "https://images.unsplash.com/photo-1583417319070-4a5401d0a8e9?w=400&h=300&fit=crop",
  TRAVEL:
    "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=400&h=300&fit=crop",
  VIETNAM_POLICY:
    "https://images.unsplash.com/photo-1528183429752-a97d0bf99f60?w=400&h=300&fit=crop",
  TOURIST:
    "https://images.unsplash.com/photo-1569163134658-6f08a4d4a3e2?w=400&h=300&fit=crop",
};

export function getFallbackThumbnail(topic: PostTopic): string {
  return FALLBACK_BY_TOPIC[topic];
}
