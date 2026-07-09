import { enforcePreset } from "@/lib/api/enforce-rate-limit";
import { apiSuccess } from "@/lib/api-response";
import {
  buildAdminPostWhere,
  parseAdminPostSearchParams,
} from "@/lib/admin/post-search-where";
import { requireAdminApi } from "@/lib/admin/require-admin-api";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const MAX_IDS = 500;

export async function GET(request: Request) {
  const limited = await enforcePreset(request, "general");
  if (limited) return limited;
  const { error } = await requireAdminApi();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const filters = parseAdminPostSearchParams(searchParams);
  const limit = Math.min(
    MAX_IDS,
    Math.max(1, Number(searchParams.get("limit")) || MAX_IDS)
  );

  const where = buildAdminPostWhere(filters);

  const rows = await prisma.post.findMany({
    where,
    take: limit,
    orderBy: { publishedAt: "desc" },
    select: { id: true },
  });

  const total = await prisma.post.count({ where });

  return apiSuccess({
    ids: rows.map((r) => r.id),
    total,
    capped: total > limit,
  });
}
