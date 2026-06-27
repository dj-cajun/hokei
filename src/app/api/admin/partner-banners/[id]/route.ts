import { enforcePreset } from "@/lib/api/enforce-rate-limit";
import { apiError, apiSuccess } from "@/lib/api-response";
import { requireAdminApi } from "@/lib/admin/require-admin-api";
import { writeAdminAudit } from "@/lib/admin/audit-log";
import { prisma } from "@/lib/prisma";
import { partnerBannerUpdateSchema } from "@/lib/partner/validate";

type RouteContext = { params: Promise<{ id: string }> };

export const dynamic = "force-dynamic";

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

  const parsed = partnerBannerUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? "유효하지 않은 입력", 400);
  }

  const existing = await prisma.partnerBanner.findUnique({ where: { id } });
  if (!existing) return apiError("배너를 찾을 수 없습니다.", 404);

  if (parsed.data.storeId) {
    const store = await prisma.partnerStore.findUnique({
      where: { id: parsed.data.storeId },
      select: { id: true },
    });
    if (!store) return apiError("업소를 찾을 수 없습니다.", 404);
  }

  if (parsed.data.linkSlug?.trim()) {
    const target = await prisma.partnerStore.findUnique({
      where: { slug: parsed.data.linkSlug.trim() },
      select: { id: true },
    });
    if (!target) {
      return apiError("linkSlug에 해당하는 업소가 없습니다.", 400);
    }
  }

  const updated = await prisma.partnerBanner.update({
    where: { id },
    data: {
      ...(parsed.data.storeId !== undefined ? { storeId: parsed.data.storeId } : {}),
      ...(parsed.data.slot !== undefined ? { slot: parsed.data.slot } : {}),
      ...(parsed.data.imageUrl !== undefined
        ? { imageUrl: parsed.data.imageUrl.trim() }
        : {}),
      ...(parsed.data.altText !== undefined
        ? { altText: parsed.data.altText?.trim() || null }
        : {}),
      ...(parsed.data.linkSlug !== undefined
        ? { linkSlug: parsed.data.linkSlug?.trim() || null }
        : {}),
      ...(parsed.data.sortOrder !== undefined ? { sortOrder: parsed.data.sortOrder } : {}),
      ...(parsed.data.isActive !== undefined ? { isActive: parsed.data.isActive } : {}),
      ...(parsed.data.startsAt !== undefined ? { startsAt: parsed.data.startsAt } : {}),
      ...(parsed.data.endsAt !== undefined ? { endsAt: parsed.data.endsAt } : {}),
    },
  });

  await writeAdminAudit({
    actorId: session!.user!.id,
    action: "PARTNER_BANNER_UPDATE",
    targetType: "PartnerBanner",
    targetId: id,
    metadata: parsed.data,
    request,
  });

  return apiSuccess({ banner: updated });
}

export async function DELETE(request: Request, context: RouteContext) {
  const limited = await enforcePreset(request, "general");
  if (limited) return limited;
  const { session, error } = await requireAdminApi();
  if (error) return error;

  const { id } = await context.params;
  const existing = await prisma.partnerBanner.findUnique({ where: { id } });
  if (!existing) return apiError("배너를 찾을 수 없습니다.", 404);

  await prisma.partnerBanner.delete({ where: { id } });

  await writeAdminAudit({
    actorId: session!.user!.id,
    action: "PARTNER_BANNER_DELETE",
    targetType: "PartnerBanner",
    targetId: id,
    request,
  });

  return apiSuccess({ deleted: true });
}
