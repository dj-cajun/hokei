import { z } from "zod";
import { enforcePreset } from "@/lib/api/enforce-rate-limit";
import { apiError, apiSuccess } from "@/lib/api-response";
import { writeAdminAudit } from "@/lib/admin/audit-log";
import { requireAdminApi } from "@/lib/admin/require-admin-api";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  status: z.enum(["OPEN", "REVIEWING", "RESOLVED", "DISMISSED"]).optional(),
  resolution: z.string().max(500).optional(),
});

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const limited = await enforcePreset(request, "general");
  if (limited) return limited;
  const { session, error } = await requireAdminApi();
  if (error) return error;

  const { id } = await context.params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("잘못된 JSON입니다.", 400);
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return apiError("유효하지 않은 요청입니다.", 400);
  }

  const existing = await prisma.contentReport.findUnique({ where: { id } });
  if (!existing) return apiError("신고를 찾을 수 없습니다.", 404);

  const status = parsed.data.status ?? existing.status;
  const resolved =
    status === "RESOLVED" || status === "DISMISSED" ? new Date() : null;

  const updated = await prisma.contentReport.update({
    where: { id },
    data: {
      status,
      resolution: parsed.data.resolution ?? existing.resolution,
      assignedToId: session!.user!.id,
      resolvedAt: resolved,
    },
  });

  await writeAdminAudit({
    actorId: session!.user!.id,
    action: "REPORT_UPDATE",
    targetType: "ContentReport",
    targetId: id,
    metadata: { status, targetType: existing.targetType, targetId: existing.targetId },
    request,
  });

  return apiSuccess({ report: updated });
}
