import { z } from "zod";
import { enforcePreset } from "@/lib/api/enforce-rate-limit";
import { apiError, apiSuccess } from "@/lib/api-response";
import { writeAdminAudit } from "@/lib/admin/audit-log";
import { requireAdminApi } from "@/lib/admin/require-admin-api";
import { prisma } from "@/lib/prisma";

const patchSchema = z.object({
  query: z.string().max(200).optional(),
  url: z.string().url().max(500).optional(),
  sourceName: z.string().min(1).max(80).optional(),
  isEnabled: z.boolean().optional(),
  sortOrder: z.number().int().min(0).max(9999).optional(),
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

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("유효하지 않은 입력", 400);
  }

  const updated = await prisma.newsSourceConfig.update({
    where: { id },
    data: parsed.data,
  });

  await writeAdminAudit({
    actorId: session!.user!.id,
    action: "NEWS_SOURCE_UPDATE",
    targetType: "NewsSourceConfig",
    targetId: id,
    metadata: parsed.data,
    request,
  });

  return apiSuccess({ source: updated });
}

export async function DELETE(request: Request, context: RouteContext) {
  const limited = await enforcePreset(request, "general");
  if (limited) return limited;
  const { session, error } = await requireAdminApi();
  if (error) return error;

  const { id } = await context.params;
  await prisma.newsSourceConfig.delete({ where: { id } });

  await writeAdminAudit({
    actorId: session!.user!.id,
    action: "NEWS_SOURCE_DELETE",
    targetType: "NewsSourceConfig",
    targetId: id,
    request,
  });

  return apiSuccess({ deleted: true });
}
