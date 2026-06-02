import { enforcePreset } from "@/lib/api/enforce-rate-limit";
import { apiSuccess } from "@/lib/api-response";
import { requireAdminApi } from "@/lib/admin/require-admin-api";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const limited = await enforcePreset(request, "general");
  if (limited) return limited;
  const { error } = await requireAdminApi();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const hiddenOnly = searchParams.get("hidden") === "1";
  const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit")) || 20));
  const cursor = searchParams.get("cursor") ?? undefined;

  const where: Prisma.CommentWhereInput = hiddenOnly ? { isHidden: true } : {};
  if (q) {
    where.OR = [
      { content: { contains: q } },
      { guestName: { contains: q } },
      { author: { name: { contains: q } } },
    ];
  }

  const comments = await prisma.comment.findMany({
    where,
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      content: true,
      createdAt: true,
      isHidden: true,
      postId: true,
      guestName: true,
      author: { select: { name: true, email: true } },
      post: { select: { title: true } },
    },
  });

  const hasMore = comments.length > limit;
  const items = hasMore ? comments.slice(0, limit) : comments;

  return apiSuccess({
    comments: items.map((c) => ({
      ...c,
      createdAt: c.createdAt.toISOString(),
      authorName: c.author?.name ?? c.guestName ?? "익명",
    })),
    nextCursor: hasMore ? items[items.length - 1]?.id : null,
  });
}
