import { z } from "zod";
import { enforcePreset } from "@/lib/api/enforce-rate-limit";
import { apiError, apiSuccess } from "@/lib/api-response";
import { requireAdminApi } from "@/lib/admin/require-admin-api";
import { writeAdminAudit } from "@/lib/admin/audit-log";
import { revalidateCategoryCaches } from "@/lib/admin/revalidate-categories";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  orderedIds: z.array(z.string().cuid()).min(1).max(200),
  parentId: z.string().cuid().nullable(),
});

export async function POST(request: Request) {
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
    return apiError("유효하지 않은 순서 데이터입니다.", 400);
  }

  const { orderedIds, parentId } = parsed.data;

  await prisma.$transaction(
    orderedIds.map((id, index) =>
      prisma.category.updateMany({
        where: { id, parentId: parentId ?? null },
        data: { sortOrder: index + 1 },
      })
    )
  );

  revalidateCategoryCaches();
  await writeAdminAudit({
    actorId: session!.user!.id,
    action: "CATEGORY_REORDER",
    metadata: { parentId, count: orderedIds.length },
    request,
  });
  return apiSuccess({ ok: true });
}
