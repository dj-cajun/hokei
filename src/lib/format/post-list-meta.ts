/** 목록 행 — 조회·댓글 */
export function formatViewsComments(views: number, comments: number): string {
  return `조회 ${views.toLocaleString()} · 댓글 ${comments.toLocaleString()}`;
}
