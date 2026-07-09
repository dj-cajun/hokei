import { enforcePreset } from "@/lib/api/enforce-rate-limit";
import { apiSuccess } from "@/lib/api-response";
import { buildAdminPostWhere } from "@/lib/admin/post-search-where";
import { requireAdminApi } from "@/lib/admin/require-admin-api";
import { prisma } from "@/lib/prisma";
import type { ModerationStatus } from "@/generated/prisma/client";

export const dynamic = "force-dynamic";

const MAX_IDS = 500;

export async function GET(request: Request) {
  const limited = await enforcePreset(request, "general");
  if (limited) return limited;
  const { error } = await requireAdminApi();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const storeName = searchParams.get("storeName")?.trim() ?? "";
  const guestOnly = searchParams.get("guestOnly") === "1";
  const moderation = searchParams.get("moderation") as
    | ModerationStatus
    | "ALL"
    | null;
  const limit = Math.min(
    MAX_IDS,
    Math.max(1, Number(searchParams.get("limit")) || MAX_IDS)
  );

  const where = buildAdminPostWhere({
    q: q || undefined,
    storeName: storeName || undefined,
    moderation: moderation ?? undefined,
    guestOnly,
  });

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
