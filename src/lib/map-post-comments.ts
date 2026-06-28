import type { CommentItem } from "@/components/posts/comment-types";
import { isCommentOwner } from "@/lib/post-ownership";
import { isPremiumPartnerOwner } from "@/lib/partner/is-premium-partner-owner";

type CommentForMap = {
  id: string;
  parentId?: string | null;
  content: string;
  createdAt: Date | string;
  authorId: string | null;
  guestName: string | null;
  guestPasswordHash: string | null;
  likeCount?: number;
  dislikeCount?: number;
  author: { name: string } | null;
};

export function mapPostComments(
  comments: CommentForMap[],
  sessionUserId?: string,
  isAdmin?: boolean,
  premiumOwnerIds?: ReadonlySet<string>
): CommentItem[] {
  return comments.map((c) => ({
    id: c.id,
    parentId: c.parentId ?? null,
    content: c.content,
    createdAt:
      typeof c.createdAt === "string"
        ? c.createdAt
        : c.createdAt.toISOString(),
    authorName: c.author?.name ?? c.guestName ?? "익명",
    authorId: c.authorId,
    likeCount: c.likeCount ?? 0,
    dislikeCount: c.dislikeCount ?? 0,
    isOwner: Boolean(isAdmin || isCommentOwner(c, sessionUserId)),
    isGuestComment: !c.authorId && Boolean(c.guestPasswordHash),
    isPremiumOwner: isPremiumPartnerOwner(c.authorId, premiumOwnerIds ?? new Set()),
  }));
}
