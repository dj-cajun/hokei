import type { Post } from "@/generated/prisma/client";

type PostWithAuthor = Pick<
  Post,
  "authorId" | "guestPasswordHash" | "isAutomated"
>;

export function isPostOwner(
  post: PostWithAuthor,
  userId: string | undefined
): boolean {
  if (!userId || !post.authorId) return false;
  return post.authorId === userId;
}

export function isCommentOwner(
  comment: { authorId: string | null },
  userId: string | undefined
): boolean {
  if (!userId || !comment.authorId) return false;
  return comment.authorId === userId;
}
