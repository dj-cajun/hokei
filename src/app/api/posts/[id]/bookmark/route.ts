import { auth } from "@/auth";
import { enforcePreset } from "@/lib/api/enforce-rate-limit";
import { apiError, apiSuccess } from "@/lib/api-response";
import { log } from "@/lib/logger";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const session = await auth();

  const post = await prisma.post.findUnique({
    where: { id },
    select: { id: true, status: true },
  });

  if (!post || post.status !== "PUBLISHED") {
    return apiError("글을 찾을 수 없습니다.", 404);
  }

  let bookmarked = false;
  if (session?.user?.id) {
    const row = await prisma.bookmark.findUnique({
      where: {
        userId_postId: { userId: session.user.id, postId: id },
      },
    });
    bookmarked = Boolean(row);
  }

  return apiSuccess({ bookmarked });
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
      select: { id: true, status: true },
    });

    if (!post || post.status !== "PUBLISHED") {
      return apiError("글을 찾을 수 없습니다.", 404);
    }

    const existing = await prisma.bookmark.findUnique({
      where: {
        userId_postId: { userId: session.user.id, postId: id },
      },
    });

    if (existing) {
      await prisma.bookmark.delete({ where: { id: existing.id } });
      return apiSuccess({ bookmarked: false });
    }

    await prisma.bookmark.create({
      data: { userId: session.user.id, postId: id },
    });

    return apiSuccess({ bookmarked: true });
  } catch (err) {
    log("error", "bookmark toggle failed", {
      error: err instanceof Error ? err.message : String(err),
    });
    return apiError("스크랩 처리에 실패했습니다.", 500);
  }
}
