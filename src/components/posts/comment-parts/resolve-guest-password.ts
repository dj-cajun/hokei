import type { CommentItem } from "@/components/posts/comment-types";
import { getGuestCommentCredentials } from "@/lib/guest-comment-storage";

export function resolveGuestPasswordForComment(
  comment: CommentItem,
  input: string,
  requiredMessage = "비밀번호를 입력해 주세요."
): { ok: true; password: string } | { ok: false; message: string } {
  if (!comment.isGuestComment || comment.isOwner) {
    return { ok: true, password: input };
  }

  let password = input;
  const cached = getGuestCommentCredentials();
  if (!password && cached) password = cached.password;

  if (!password) {
    return { ok: false, message: requiredMessage };
  }

  return { ok: true, password };
}
