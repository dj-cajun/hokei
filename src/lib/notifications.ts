import { log } from "@/lib/logger";
import { prisma } from "@/lib/prisma";

export type NotificationType = "COMMENT" | "LIKE" | "MESSAGE" | "SYSTEM";

export async function createNotification(input: {
  userId: string;
  type: NotificationType;
  title: string;
  body?: string;
  href?: string;
}) {
  if (!input.userId.trim()) return;
  try {
    await prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        title: input.title,
        body: input.body ?? null,
        href: input.href ?? null,
      },
    });
  } catch (err) {
    log("warn", "notification create failed", {
      type: input.type,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

export async function notifyPostComment(params: {
  postAuthorId: string | null | undefined;
  actorUserId: string | null | undefined;
  actorName: string;
  postId: string;
  postTitle: string;
}) {
  const { postAuthorId, actorUserId, actorName, postId, postTitle } = params;
  if (!postAuthorId || postAuthorId === actorUserId) return;
  await createNotification({
    userId: postAuthorId,
    type: "COMMENT",
    title: "새 댓글이 달렸습니다",
    body: `${actorName}님이 「${postTitle.slice(0, 40)}」에 댓글을 남겼습니다.`,
    href: `/posts/${postId}`,
  });
}

export async function notifyPostLike(params: {
  postAuthorId: string | null | undefined;
  actorUserId: string;
  postId: string;
  postTitle: string;
}) {
  const { postAuthorId, actorUserId, postId, postTitle } = params;
  if (!postAuthorId || postAuthorId === actorUserId) return;
  await createNotification({
    userId: postAuthorId,
    type: "LIKE",
    title: "글에 좋아요가 달렸습니다",
    body: `「${postTitle.slice(0, 40)}」`,
    href: `/posts/${postId}`,
  });
}

export async function notifyDirectMessage(params: {
  recipientId: string;
  senderName: string;
  conversationId: string;
  preview: string;
}) {
  const { recipientId, senderName, conversationId, preview } = params;
  await createNotification({
    userId: recipientId,
    type: "MESSAGE",
    title: `${senderName}님의 새 쪽지`,
    body: preview.slice(0, 80),
    href: `/messages/${conversationId}`,
  });
}
