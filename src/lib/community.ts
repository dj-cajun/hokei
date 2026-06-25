export const COMMUNITY_SOURCE_PREFIX = "hokei:community:";

export function isCommunityPost(sourceUrl: string): boolean {
  return sourceUrl.startsWith(COMMUNITY_SOURCE_PREFIX);
}

/** 커뮤니티·거래·홍보 등 사용자/AI 큐레이션 게시글 */
export function isUserBoardPost(sourceUrl: string): boolean {
  return (
    isCommunityPost(sourceUrl) ||
    sourceUrl.startsWith("hokei:ai-curate:")
  );
}

export function getAuthorDisplayName(post: {
  isAutomated: boolean;
  guestName: string | null;
  author: { name: string } | null;
}): string | null {
  if (post.isAutomated) return null;
  if (post.author?.name) return post.author.name;
  if (post.guestName) return post.guestName;
  return "익명";
}
