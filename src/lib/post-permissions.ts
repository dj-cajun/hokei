import { compare, hash } from "bcryptjs";
import type { Post } from "@/generated/prisma/client";
import { auth } from "@/auth";
import { canUserManagePromoPostByStoreName } from "@/lib/partner/store-timeline-write";
import { isCommentOwner, isPostOwner } from "@/lib/post-ownership";

export { isCommentOwner, isPostOwner } from "@/lib/post-ownership";

export async function hashGuestPassword(password: string): Promise<string> {
  return hash(password, 10);
}

export async function verifyGuestPassword(
  password: string,
  hashValue: string | null | undefined
): Promise<boolean> {
  if (!hashValue) return false;
  return compare(password, hashValue);
}

type PostWithAuthor = Pick<
  Post,
  "authorId" | "guestPasswordHash" | "isAutomated" | "storeName"
>;

type CommentWithAuthor = {
  authorId: string | null;
  guestPasswordHash: string | null;
};

export async function canModifyComment(
  comment: CommentWithAuthor,
  options?: { guestPassword?: string }
): Promise<boolean> {
  const session = await auth();
  if (session?.user?.role === "ADMIN") return true;
  if (isCommentOwner(comment, session?.user?.id)) return true;
  if (comment.guestPasswordHash && options?.guestPassword) {
    return verifyGuestPassword(
      options.guestPassword,
      comment.guestPasswordHash
    );
  }
  return false;
}

export async function canModifyPost(
  post: PostWithAuthor,
  options?: { guestPassword?: string }
): Promise<boolean> {
  const session = await auth();
  if (session?.user?.role === "ADMIN") return true;
  if (isPostOwner(post, session?.user?.id)) return true;
  if (await canUserManagePromoPostByStoreName(session, post.storeName)) {
    return true;
  }
  if (post.guestPasswordHash && options?.guestPassword) {
    return verifyGuestPassword(options.guestPassword, post.guestPasswordHash);
  }
  return false;
}
