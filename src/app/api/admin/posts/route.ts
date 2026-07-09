import { enforcePreset } from "@/lib/api/enforce-rate-limit";
import { apiSuccess } from "@/lib/api-response";
import {
  buildAdminPostWhere,
  parseAdminPostSearchParams,
} from "@/lib/admin/post-search-where";
import { requireAdminApi } from "@/lib/admin/require-admin-api";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const limited = await enforcePreset(request, "general");
  if (limited) return limited;
  const { error } = await requireAdminApi();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const filters = parseAdminPostSearchParams(searchParams);
  const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit")) || 30));
  const cursor = searchParams.get("cursor") ?? undefined;

  const where = buildAdminPostWhere(filters);

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
      category: {
        select: {
          label: true,
          slug: true,
          parent: { select: { label: true, slug: true } },
        },
      },
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
      isGuest: !p.author && Boolean(p.guestName),
      boardLabel: p.category.parent
        ? `${p.category.parent.label} · ${p.category.label}`
        : p.category.label,
    })),
    nextCursor: hasMore ? items[items.length - 1]?.id : null,
  });
}
