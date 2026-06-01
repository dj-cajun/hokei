import type { CommentItem } from "@/components/posts/post-comments";
import { isCommentOwner } from "@/lib/post-ownership";

type CommentForMap = {
  id: string;
  content: string;
  createdAt: Date;
  authorId: string | null;
  guestName: string | null;
  guestPasswordHash: string | null;
  author: { name: string } | null;
};

export function mapPostComments(
  comments: CommentForMap[],
  sessionUserId?: string,
  isAdmin?: boolean
): CommentItem[] {
  return comments.map((c) => ({
    id: c.id,
    content: c.content,
    createdAt: c.createdAt.toISOString(),
    authorName: c.author?.name ?? c.guestName ?? "익명",
    isOwner: Boolean(isAdmin || isCommentOwner(c, sessionUserId)),
    isGuestComment: !c.authorId && Boolean(c.guestPasswordHash),
  }));
}
