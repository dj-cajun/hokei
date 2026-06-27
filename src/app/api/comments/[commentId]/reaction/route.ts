import { z } from "zod";
import { auth } from "@/auth";
import { enforcePreset } from "@/lib/api/enforce-rate-limit";
import { apiError, apiSuccess } from "@/lib/api-response";
import { log } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { visibleCommentWhere } from "@/lib/moderation";
import { enforceActiveUser } from "@/lib/user-moderation";

type RouteContext = { params: Promise<{ commentId: string }> };

const reactionSchema = z.object({
  reaction: z.enum(["like", "dislike"]),
});

export async function GET(_request: Request, context: RouteContext) {
  const { commentId } = await context.params;
  const session = await auth();

  const comment = await prisma.comment.findFirst({
    where: { id: commentId, ...visibleCommentWhere },
    select: { id: true, likeCount: true, dislikeCount: true },
  });

  if (!comment) {
    return apiError("댓글을 찾을 수 없습니다.", 404);
  }

  let likedByMe = false;
  let dislikedByMe = false;

  if (session?.user?.id) {
    const [like, dislike] = await Promise.all([
      prisma.commentLike.findUnique({
        where: {
          userId_commentId: { userId: session.user.id, commentId },
        },
      }),
      prisma.commentDislike.findUnique({
        where: {
          userId_commentId: { userId: session.user.id, commentId },
        },
      }),
    ]);
    likedByMe = Boolean(like);
    dislikedByMe = Boolean(dislike);
  }

  return apiSuccess({
    likeCount: comment.likeCount,
    dislikeCount: comment.dislikeCount,
    likedByMe,
    dislikedByMe,
  });
}

export async function POST(request: Request, context: RouteContext) {
  const limited = await enforcePreset(request, "general");
  if (limited) return limited;

  const session = await auth();
  if (!session?.user?.id) {
    return apiError("로그인이 필요합니다.", 401);
  }

  const active = await enforceActiveUser(session.user.id);
  if (!active.ok) {
    return apiError(active.error, active.status);
  }

  const { commentId } = await context.params;

  try {
    const json = await request.json();
    const parsed = reactionSchema.safeParse(json);
    if (!parsed.success) {
      return apiError("요청 형식이 올바르지 않습니다.", 400);
    }

    const comment = await prisma.comment.findFirst({
      where: { id: commentId, ...visibleCommentWhere },
      select: { id: true },
    });

    if (!comment) {
      return apiError("댓글을 찾을 수 없습니다.", 404);
    }

    const userId = session.user.id;
    const { reaction } = parsed.data;

    const [existingLike, existingDislike] = await Promise.all([
      prisma.commentLike.findUnique({
        where: { userId_commentId: { userId, commentId } },
      }),
      prisma.commentDislike.findUnique({
        where: { userId_commentId: { userId, commentId } },
      }),
    ]);

    if (reaction === "like") {
      if (existingLike) {
        await prisma.$transaction([
          prisma.commentLike.delete({ where: { id: existingLike.id } }),
          prisma.comment.update({
            where: { id: commentId },
            data: { likeCount: { decrement: 1 } },
          }),
        ]);
      } else {
        const ops = [
          prisma.commentLike.create({ data: { userId, commentId } }),
          prisma.comment.update({
            where: { id: commentId },
            data: { likeCount: { increment: 1 } },
          }),
        ];
        if (existingDislike) {
          ops.unshift(
            prisma.commentDislike.delete({ where: { id: existingDislike.id } }),
            prisma.comment.update({
              where: { id: commentId },
              data: { dislikeCount: { decrement: 1 } },
            })
          );
        }
        await prisma.$transaction(ops);
      }
    } else if (existingDislike) {
      await prisma.$transaction([
        prisma.commentDislike.delete({ where: { id: existingDislike.id } }),
        prisma.comment.update({
          where: { id: commentId },
          data: { dislikeCount: { decrement: 1 } },
        }),
      ]);
    } else {
      const ops = [
        prisma.commentDislike.create({ data: { userId, commentId } }),
        prisma.comment.update({
          where: { id: commentId },
          data: { dislikeCount: { increment: 1 } },
        }),
      ];
      if (existingLike) {
        ops.unshift(
          prisma.commentLike.delete({ where: { id: existingLike.id } }),
          prisma.comment.update({
            where: { id: commentId },
            data: { likeCount: { decrement: 1 } },
          })
        );
      }
      await prisma.$transaction(ops);
    }

    const updated = await prisma.comment.findUnique({
      where: { id: commentId },
      select: { likeCount: true, dislikeCount: true },
    });

    const [likedByMe, dislikedByMe] = await Promise.all([
      prisma.commentLike.findUnique({
        where: { userId_commentId: { userId, commentId } },
      }),
      prisma.commentDislike.findUnique({
        where: { userId_commentId: { userId, commentId } },
      }),
    ]);

    return apiSuccess({
      likeCount: Math.max(0, updated?.likeCount ?? 0),
      dislikeCount: Math.max(0, updated?.dislikeCount ?? 0),
      likedByMe: Boolean(likedByMe),
      dislikedByMe: Boolean(dislikedByMe),
    });
  } catch (err) {
    log("error", "comment reaction toggle failed", {
      error: err instanceof Error ? err.message : String(err),
    });
    return apiError("반응 처리에 실패했습니다.", 500);
  }
}
