export type CommentItem = {
  id: string;
  parentId?: string | null;
  content: string;
  createdAt: string;
  authorName: string;
  isOwner: boolean;
  isGuestComment: boolean;
  /** optimistic UI 임시 댓글 */
  pending?: boolean;
};
