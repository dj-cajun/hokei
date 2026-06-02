import { enforcePreset } from "@/lib/api/enforce-rate-limit";
import { apiSuccess } from "@/lib/api-response";
import { requireAdminApi } from "@/lib/admin/require-admin-api";
import { prisma } from "@/lib/prisma";
import type { ModerationStatus, Prisma } from "@/generated/prisma/client";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const limited = await enforcePreset(request, "general");
  if (limited) return limited;
  const { error } = await requireAdminApi();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const moderation = searchParams.get("moderation") as ModerationStatus | "ALL" | null;
  const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit")) || 20));
  const cursor = searchParams.get("cursor") ?? undefined;

  const where: Prisma.PostWhereInput = {};
  if (moderation && moderation !== "ALL") {
    where.moderationStatus = moderation;
  }
  if (q) {
    where.OR = [
      { title: { contains: q } },
      { summary: { contains: q } },
      { guestName: { contains: q } },
      { author: { name: { contains: q } } },
    ];
  }

  const posts = await prisma.post.findMany({
    where,
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    orderBy: { publishedAt: "desc" },
    select: {
      id: true,
      title: true,
      publishedAt: true,
      views: true,
      commentCount: true,
      isAutomated: true,
      isNotice: true,
      moderationStatus: true,
      status: true,
      sourceUrl: true,
      category: { select: { label: true, slug: true } },
      author: { select: { name: true, email: true } },
      guestName: true,
    },
  });

  const hasMore = posts.length > limit;
  const items = hasMore ? posts.slice(0, limit) : posts;

  return apiSuccess({
    posts: items.map((p) => ({
      ...p,
      publishedAt: p.publishedAt.toISOString(),
      authorName: p.author?.name ?? p.guestName ?? "익명",
    })),
    nextCursor: hasMore ? items[items.length - 1]?.id : null,
  });
}
