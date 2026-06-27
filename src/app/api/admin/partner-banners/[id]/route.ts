import { enforcePreset } from "@/lib/api/enforce-rate-limit";
import { apiError, apiSuccess } from "@/lib/api-response";
import { writeAdminAudit } from "@/lib/admin/audit-log";
import { requireAdminApi } from "@/lib/admin/require-admin-api";
import { nullIfEmpty } from "@/lib/partner/admin-map";
import { revalidatePartnerPublicPaths } from "@/lib/partner/revalidate-paths";
import { partnerBannerUpdateSchema } from "@/lib/partner/validate";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const limited = await enforcePreset(request, "general");
  if (limited) return limited;
  const { session, error } = await requireAdminApi();
  if (error) return error;

  const { id } = await context.params;
  const existing = await prisma.partnerBanner.findUnique({
    where: { id },
    include: { store: { select: { slug: true } } },
  });
  if (!existing) {
    return apiError("배너를 찾을 수 없습니다.", 404);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("잘못된 JSON입니다.", 400);
  }

  const parsed = partnerBannerUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(
      parsed.error.issues[0]?.message ?? "입력값이 올바르지 않습니다.",
      400
    );
  }

  if (parsed.data.storeId) {
    const store = await prisma.partnerStore.findUnique({
      where: { id: parsed.data.storeId },
      select: { id: true },
    });
    if (!store) {
      return apiError("업소를 찾을 수 없습니다.", 404);
    }
  }

  const banner = await prisma.partnerBanner.update({
    where: { id },
    data: {
      ...(parsed.data.storeId !== undefined
        ? { storeId: parsed.data.storeId }
        : {}),
      ...(parsed.data.slot !== undefined ? { slot: parsed.data.slot } : {}),
      ...(parsed.data.imageUrl !== undefined
        ? { imageUrl: parsed.data.imageUrl.trim() }
        : {}),
      ...(parsed.data.mobileImageUrl !== undefined
        ? { mobileImageUrl: nullIfEmpty(parsed.data.mobileImageUrl ?? undefined) }
        : {}),
      ...(parsed.data.altText !== undefined
        ? { altText: nullIfEmpty(parsed.data.altText) }
        : {}),
      ...(parsed.data.linkSlug !== undefined
        ? { linkSlug: nullIfEmpty(parsed.data.linkSlug) }
        : {}),
      ...(parsed.data.sortOrder !== undefined
        ? { sortOrder: parsed.data.sortOrder }
        : {}),
      ...(parsed.data.isActive !== undefined
        ? { isActive: parsed.data.isActive }
        : {}),
      ...(parsed.data.startsAt !== undefined
        ? { startsAt: parsed.data.startsAt }
        : {}),
      ...(parsed.data.endsAt !== undefined ? { endsAt: parsed.data.endsAt } : {}),
    },
    include: {
      store: { select: { id: true, name: true, slug: true, status: true } },
    },
  });

  revalidatePartnerPublicPaths(
    existing.linkSlug ?? existing.store.slug,
    banner.linkSlug ?? banner.store.slug
  );

  await writeAdminAudit({
    actorId: session!.user!.id,
    action: "PARTNER_BANNER_UPDATE",
    targetType: "PartnerBanner",
    targetId: id,
    metadata: { slot: banner.slot, isActive: banner.isActive },
    request,
  });

  return apiSuccess({ banner });
}

export async function DELETE(request: Request, context: RouteContext) {
  const limited = await enforcePreset(request, "general");
  if (limited) return limited;
  const { session, error } = await requireAdminApi();
  if (error) return error;

  const { id } = await context.params;
  const existing = await prisma.partnerBanner.findUnique({
    where: { id },
    include: { store: { select: { slug: true } } },
  });
  if (!existing) {
    return apiError("배너를 찾을 수 없습니다.", 404);
  }

  await prisma.partnerBanner.delete({ where: { id } });
  revalidatePartnerPublicPaths(existing.linkSlug ?? existing.store.slug);

  await writeAdminAudit({
    actorId: session!.user!.id,
    action: "PARTNER_BANNER_DELETE",
    targetType: "PartnerBanner",
    targetId: id,
    request,
  });

  return apiSuccess({ deleted: true });
}
