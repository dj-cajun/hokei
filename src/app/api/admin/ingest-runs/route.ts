import { enforcePreset } from "@/lib/api/enforce-rate-limit";
import { apiSuccess } from "@/lib/api-response";
import { requireAdminApi } from "@/lib/admin/require-admin-api";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const limited = await enforcePreset(request, "general");
  if (limited) return limited;

  const { error } = await requireAdminApi();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 30));
  const cursor = searchParams.get("cursor") ?? undefined;

  const runs = await prisma.newsIngestRun.findMany({
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    orderBy: { runAt: "desc" },
  });

  const hasMore = runs.length > limit;
  const items = hasMore ? runs.slice(0, limit) : runs;
  const nextCursor = hasMore ? items[items.length - 1]?.id : null;

  return apiSuccess({
    runs: items.map((r) => ({
      id: r.id,
      runAt: r.runAt.toISOString(),
      inserted: r.inserted,
      skipped: r.skipped,
      errors: r.errors,
      errorDetails: r.errorDetails,
      durationMs: r.durationMs,
      triggeredBy: r.triggeredBy,
      timezone: r.timezone,
    })),
    nextCursor,
  });
}
