import type { FeedItem } from "@/types/feed";
import { isCommunityPost } from "@/lib/community";

/** 목록 썸네일 영역 표시 — 자동 뉴스(http 기사 URL)는 항상 표시 */
export function shouldShowFeedThumbnail(item: FeedItem): boolean {
  if (item.thumbnail?.trim()) return true;
  if (item.sourceUrl?.startsWith("http")) return true;
  if (item.sourceUrl && !isCommunityPost(item.sourceUrl)) return true;
  return false;
}
