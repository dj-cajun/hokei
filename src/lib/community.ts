export const COMMUNITY_SOURCE_PREFIX = "hokei:community:";

export function isCommunityPost(sourceUrl: string): boolean {
  return sourceUrl.startsWith(COMMUNITY_SOURCE_PREFIX);
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
