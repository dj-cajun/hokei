import { z } from "zod";
import { auth } from "@/auth";
import {
  enforceGuestCommentPasswordAttempts,
  enforcePreset,
} from "@/lib/api/enforce-rate-limit";
import { apiError, apiSuccess } from "@/lib/api-response";
import {
  COMMENT_MAX_LENGTH,
  GUEST_PASSWORD_MAX_LENGTH,
  GUEST_PASSWORD_MIN_LENGTH,
} from "@/lib/constants";
import { log } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { canModifyComment, isCommentOwner } from "@/lib/post-permissions";

const patchSchema = z.object({
  content: z.string().min(1).max(COMMENT_MAX_LENGTH),
  guestPassword: z
    .string()
    .min(GUEST_PASSWORD_MIN_LENGTH)
    .max(GUEST_PASSWORD_MAX_LENGTH)
    .optional(),
});

const deleteSchema = z.object({
  guestPassword: z
    .string()
    .min(GUEST_PASSWORD_MIN_LENGTH)
    .max(GUEST_PASSWORD_MAX_LENGTH)
    .optional(),
});

type RouteContext = {
  params: Promise<{ id: string; commentId: string }>;
};

function serializeComment(
  c: {
    id: string;
    content: string;
    createdAt: Date;
    author: { name: string } | null;
    guestName: string | null;
    authorId: string | null;
    guestPasswordHash: string | null;
  },
  viewer: { userId?: string; isAdmin: boolean }
) {
  return {
    id: c.id,
    content: c.content,
    createdAt: c.createdAt.toISOString(),
    authorName: c.author?.name ?? c.guestName ?? "익명",
    isOwner: viewer.isAdmin || isCommentOwner(c, viewer.userId),
    isGuestComment: !c.authorId && Boolean(c.guestPasswordHash),
  };
}

async function loadComment(postId: string, commentId: string) {
  const comment = await prisma.comment.findFirst({
    where: { id: commentId, postId },
    include: { author: { select: { name: true } } },
  });
  if (!comment) return null;

  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { status: true },
  });
  if (!post || post.status !== "PUBLISHED") return null;

  return comment;
}

export async function PATCH(request: Request, context: RouteContext) {
  const limited = await enforcePreset(request, "commentsPatch");
  if (limited) return limited;

  try {
    const { id: postId, commentId } = await context.params;
    const comment = await loadComment(postId, commentId);
    if (!comment) {
      return apiError("댓글을 찾을 수 없습니다.", 404);
    }

    const json = await request.json();
    const parsed = patchSchema.safeParse(json);
    if (!parsed.success) {
      return apiError(
        parsed.error.issues[0]?.message ?? "댓글 내용을 확인해 주세요.",
        400
      );
    }

    const session = await auth();
    if (!session?.user && parsed.data.guestPassword) {
      const blocked = enforceGuestCommentPasswordAttempts(request, commentId);
      if (blocked) return blocked;
    }

    const allowed = await canModifyComment(comment, {
      guestPassword: parsed.data.guestPassword,
    });
    if (!allowed) {
      return apiError("수정 권한이 없습니다.", 403);
    }

    const updated = await prisma.comment.update({
      where: { id: commentId },
      data: { content: parsed.data.content.trim() },
      include: { author: { select: { name: true } } },
    });

    return apiSuccess(
      serializeComment(updated, {
        userId: session?.user?.id,
        isAdmin: session?.user?.role === "ADMIN",
      })
    );
  } catch (err) {
    log("error", "comment patch failed", {
      error: err instanceof Error ? err.message : String(err),
    });
    return apiError("댓글 수정 중 오류가 발생했습니다.", 500);
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const limited = await enforcePreset(request, "commentsDelete");
  if (limited) return limited;

  try {
    const { id: postId, commentId } = await context.params;
    const comment = await loadComment(postId, commentId);
    if (!comment) {
      return apiError("댓글을 찾을 수 없습니다.", 404);
    }

    let guestPassword: string | undefined;
    try {
      const json = await request.json();
      const parsed = deleteSchema.safeParse(json);
      if (parsed.success) guestPassword = parsed.data.guestPassword;
    } catch {
      /* empty body */
    }

    const session = await auth();
    if (!session?.user && guestPassword) {
      const blocked = enforceGuestCommentPasswordAttempts(request, commentId);
      if (blocked) return blocked;
    }

    const allowed = await canModifyComment(comment, { guestPassword });
    if (!allowed) {
      return apiError("삭제 권한이 없습니다.", 403);
    }

    await prisma.$transaction([
      prisma.comment.delete({ where: { id: commentId } }),
      prisma.post.update({
        where: { id: postId },
        data: { commentCount: { decrement: 1 } },
      }),
    ]);

    return apiSuccess({ deleted: true });
  } catch (err) {
    log("error", "comment delete failed", {
      error: err instanceof Error ? err.message : String(err),
    });
    return apiError("댓글 삭제 중 오류가 발생했습니다.", 500);
  }
}
