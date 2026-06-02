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
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 50));
  const action = searchParams.get("action")?.trim();

  const logs = await prisma.adminAuditLog.findMany({
    where: action ? { action: { contains: action } } : {},
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  const actorIds = [...new Set(logs.map((l) => l.actorId))];
  const actors = await prisma.user.findMany({
    where: { id: { in: actorIds } },
    select: { id: true, name: true, email: true },
  });
  const actorMap = new Map(actors.map((a) => [a.id, a]));

  return apiSuccess({
    logs: logs.map((l) => ({
      ...l,
      createdAt: l.createdAt.toISOString(),
      actor: actorMap.get(l.actorId) ?? { id: l.actorId, name: "?", email: "" },
    })),
  });
}
