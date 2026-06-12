import type { CommentItem } from "@/components/posts/comment-types";

export type CommentThread = CommentItem & {
  replies: CommentItem[];
};

/** flat 댓글 → 1단계 트리 (루트 + 답글) */
export function groupCommentsToThreads(comments: CommentItem[]): CommentThread[] {
  const roots: CommentItem[] = [];
  const repliesByParent = new Map<string, CommentItem[]>();

  for (const c of comments) {
    if (c.parentId) {
      const list = repliesByParent.get(c.parentId) ?? [];
      list.push(c);
      repliesByParent.set(c.parentId, list);
    } else {
      roots.push(c);
    }
  }

  return roots.map((root) => ({
    ...root,
    replies: repliesByParent.get(root.id) ?? [],
  }));
}
