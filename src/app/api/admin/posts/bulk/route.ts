import { z } from "zod";
import { enforcePreset } from "@/lib/api/enforce-rate-limit";
import { apiError, apiSuccess } from "@/lib/api-response";
import { writeAdminAudit } from "@/lib/admin/audit-log";
import { requireAdminApi } from "@/lib/admin/require-admin-api";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  ids: z.array(z.string().cuid()).min(1).max(100),
  action: z.enum(["HIDE", "RESTORE", "REMOVE"]),
  note: z.string().max(500).optional(),
});

export async function PATCH(request: Request) {
  const limited = await enforcePreset(request, "general");
  if (limited) return limited;
  const { session, error } = await requireAdminApi();
  if (error) return error;

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

  const { ids, action, note } = parsed.data;
  const statusMap = {
    HIDE: "HIDDEN",
    RESTORE: "VISIBLE",
    REMOVE: "REMOVED",
  } as const;

  const result = await prisma.post.updateMany({
    where: { id: { in: ids } },
    data: {
      moderationStatus: statusMap[action],
      moderatedAt: new Date(),
      moderatedById: session!.user!.id,
      moderationNote: note ?? null,
    },
  });

  await writeAdminAudit({
    actorId: session!.user!.id,
    action: `POST_BULK_${action}`,
    metadata: { ids, count: result.count },
    request,
  });

  return apiSuccess({ updated: result.count });
}
