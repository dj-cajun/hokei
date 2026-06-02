import { enforcePreset } from "@/lib/api/enforce-rate-limit";
import { apiError, apiSuccess } from "@/lib/api-response";
import { requireAdminApi } from "@/lib/admin/require-admin-api";
import { patchCategorySchema } from "@/lib/admin/categories-api";
import { writeAdminAudit } from "@/lib/admin/audit-log";
import { revalidateCategoryCaches } from "@/lib/admin/revalidate-categories";
import { prisma } from "@/lib/prisma";

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

  const parsed = patchCategorySchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? "유효하지 않은 입력", 400);
  }

  const existing = await prisma.category.findUnique({ where: { id } });
  if (!existing) return apiError("카테고리를 찾을 수 없습니다.", 404);

  const updated = await prisma.category.update({
    where: { id },
    data: parsed.data,
  });

  revalidateCategoryCaches();
  await writeAdminAudit({
    actorId: session!.user!.id,
    action: "CATEGORY_UPDATE",
    targetType: "Category",
    targetId: id,
    metadata: parsed.data,
    request,
  });
  return apiSuccess({ category: updated });
}

export async function DELETE(request: Request, context: RouteContext) {
  const limited = await enforcePreset(request, "general");
  if (limited) return limited;
  const { session, error } = await requireAdminApi();
  if (error) return error;

  const { id } = await context.params;
  const existing = await prisma.category.findUnique({
    where: { id },
    include: { _count: { select: { posts: true, children: true } } },
  });
  if (!existing) return apiError("카테고리를 찾을 수 없습니다.", 404);
  if (existing._count.posts > 0) {
    return apiError("게시글이 있는 카테고리는 삭제할 수 없습니다.", 400);
  }
  if (existing._count.children > 0) {
    return apiError("하위 카테고리가 있으면 삭제할 수 없습니다.", 400);
  }

  await prisma.category.delete({ where: { id } });
  revalidateCategoryCaches();
  await writeAdminAudit({
    actorId: session!.user!.id,
    action: "CATEGORY_DELETE",
    targetType: "Category",
    targetId: id,
    request,
  });
  return apiSuccess({ deleted: true });
}
