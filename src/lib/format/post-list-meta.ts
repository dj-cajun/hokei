/** 목록 행 — 조회·좋아요·댓글 */
export function formatViewsComments(
  views: number,
  comments: number,
  likes?: number
): string {
  const parts = [`조회 ${views.toLocaleString()}`];
  if (likes && likes > 0) {
    parts.push(`추천 ${likes.toLocaleString()}`);
  }
  parts.push(`댓글 ${comments.toLocaleString()}`);
  return parts.join(" · ");
}
