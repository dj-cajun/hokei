import { auth } from "@/auth";
import { enforcePreset } from "@/lib/api/enforce-rate-limit";
import { apiError, apiSuccess } from "@/lib/api-response";
import { log } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { notifyPostLike } from "@/lib/notifications";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const session = await auth();

  const post = await prisma.post.findUnique({
    where: { id },
    select: { id: true, likeCount: true, status: true },
  });

  if (!post || post.status !== "PUBLISHED") {
    return apiError("글을 찾을 수 없습니다.", 404);
  }

  let likedByMe = false;
  if (session?.user?.id) {
    const like = await prisma.postLike.findUnique({
      where: {
        userId_postId: { userId: session.user.id, postId: id },
      },
    });
    likedByMe = Boolean(like);
  }

  return apiSuccess({
    likeCount: post.likeCount,
    likedByMe,
  });
}

export async function POST(request: Request, context: RouteContext) {
  const limited = await enforcePreset(request, "general");
  if (limited) return limited;

  const session = await auth();
  if (!session?.user?.id) {
    return apiError("로그인이 필요합니다.", 401);
  }

  const { id } = await context.params;

  try {
    const post = await prisma.post.findUnique({
      where: { id },
      select: { id: true, title: true, status: true, authorId: true },
    });

    if (!post || post.status !== "PUBLISHED") {
      return apiError("글을 찾을 수 없습니다.", 404);
    }

    const existing = await prisma.postLike.findUnique({
      where: {
        userId_postId: { userId: session.user.id, postId: id },
      },
    });

    if (existing) {
      await prisma.$transaction([
        prisma.postLike.delete({ where: { id: existing.id } }),
        prisma.post.update({
          where: { id },
          data: { likeCount: { decrement: 1 } },
        }),
      ]);
      const updated = await prisma.post.findUnique({
        where: { id },
        select: { likeCount: true },
      });
      return apiSuccess({
        liked: false,
        likeCount: Math.max(0, updated?.likeCount ?? 0),
      });
    }

    await prisma.$transaction([
      prisma.postLike.create({
        data: { userId: session.user.id, postId: id },
      }),
      prisma.post.update({
        where: { id },
        data: { likeCount: { increment: 1 } },
      }),
    ]);

    const updated = await prisma.post.findUnique({
      where: { id },
      select: { likeCount: true },
    });

    void notifyPostLike({
      postAuthorId: post.authorId,
      actorUserId: session.user.id,
      postId: id,
      postTitle: post.title,
    });

    return apiSuccess({
      liked: true,
      likeCount: updated?.likeCount ?? 1,
    });
  } catch (err) {
    log("error", "post like toggle failed", {
      error: err instanceof Error ? err.message : String(err),
    });
    return apiError("좋아요 처리에 실패했습니다.", 500);
  }
}
