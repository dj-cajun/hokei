import { enforcePreset } from "@/lib/api/enforce-rate-limit";
import { apiError, apiSuccess } from "@/lib/api-response";
import { writeAdminAudit } from "@/lib/admin/audit-log";
import { requireAdminApi } from "@/lib/admin/require-admin-api";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

export async function DELETE(request: Request, context: RouteContext) {
  const limited = await enforcePreset(request, "general");
  if (limited) return limited;
  const { session, error } = await requireAdminApi();
  if (error) return error;

  const { id } = await context.params;
  const existing = await prisma.ipBlockEntry.findUnique({ where: { id } });
  if (!existing) return apiError("항목을 찾을 수 없습니다.", 404);

  await prisma.ipBlockEntry.delete({ where: { id } });

  await writeAdminAudit({
    actorId: session!.user!.id,
    action: "IP_BLOCK_DELETE",
    targetType: "IpBlockEntry",
    targetId: id,
    metadata: { pattern: existing.pattern },
    request,
  });

  return apiSuccess({ deleted: true });
}
