import { z } from "zod";
import { enforcePreset } from "@/lib/api/enforce-rate-limit";
import { apiError, apiSuccess } from "@/lib/api-response";
import { writeAdminAudit } from "@/lib/admin/audit-log";
import { requireAdminApi } from "@/lib/admin/require-admin-api";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  ids: z.array(z.string().cuid()).min(1).max(100),
  action: z.enum(["HIDE", "RESTORE", "DELETE"]),
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

  const { ids, action } = parsed.data;
  const adminId = session!.user!.id;

  if (action === "DELETE") {
    const result = await prisma.comment.deleteMany({
      where: { id: { in: ids } },
    });
    return apiSuccess({ deleted: result.count });
  }

  const hide = action === "HIDE";
  const result = await prisma.comment.updateMany({
    where: { id: { in: ids } },
    data: {
      isHidden: hide,
      hiddenAt: hide ? new Date() : null,
      hiddenById: hide ? adminId : null,
    },
  });

  await writeAdminAudit({
    actorId: session!.user!.id,
    action: hide ? "COMMENT_BULK_HIDE" : "COMMENT_BULK_RESTORE",
    metadata: { ids, count: result.count },
    request,
  });

  return apiSuccess({ updated: result.count });
}
