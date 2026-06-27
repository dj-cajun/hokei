import { enforcePreset } from "@/lib/api/enforce-rate-limit";
import { apiError, apiSuccess } from "@/lib/api-response";
import { writeAdminAudit } from "@/lib/admin/audit-log";
import { requireAdminApi } from "@/lib/admin/require-admin-api";
import { nullIfEmpty } from "@/lib/partner/admin-map";
import { revalidatePartnerPublicPaths } from "@/lib/partner/revalidate-paths";
import { partnerBannerCreateSchema } from "@/lib/partner/validate";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const limited = await enforcePreset(request, "general");
  if (limited) return limited;
  const { error } = await requireAdminApi();
  if (error) return error;

  const banners = await prisma.partnerBanner.findMany({
    include: {
      store: { select: { id: true, name: true, slug: true, status: true } },
    },
    orderBy: [{ slot: "asc" }, { sortOrder: "asc" }, { updatedAt: "desc" }],
  });

  return apiSuccess({ banners });
}

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

  const parsed = partnerBannerCreateSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(
      parsed.error.issues[0]?.message ?? "입력값이 올바르지 않습니다.",
      400
    );
  }

  const store = await prisma.partnerStore.findUnique({
    where: { id: parsed.data.storeId },
    select: { id: true, slug: true },
  });
  if (!store) {
    return apiError("업소를 찾을 수 없습니다.", 404);
  }

  const banner = await prisma.partnerBanner.create({
    data: {
      storeId: parsed.data.storeId,
      slot: parsed.data.slot,
      imageUrl: parsed.data.imageUrl.trim(),
      mobileImageUrl: nullIfEmpty(parsed.data.mobileImageUrl ?? undefined),
      altText: nullIfEmpty(parsed.data.altText),
      linkSlug: nullIfEmpty(parsed.data.linkSlug),
      sortOrder: parsed.data.sortOrder ?? 0,
      isActive: parsed.data.isActive ?? true,
      startsAt: parsed.data.startsAt ?? null,
      endsAt: parsed.data.endsAt ?? null,
    },
    include: {
      store: { select: { id: true, name: true, slug: true, status: true } },
    },
  });

  revalidatePartnerPublicPaths(banner.linkSlug ?? store.slug);

  await writeAdminAudit({
    actorId: session!.user!.id,
    action: "PARTNER_BANNER_CREATE",
    targetType: "PartnerBanner",
    targetId: banner.id,
    metadata: { slot: banner.slot, storeId: banner.storeId },
    request,
  });

  return apiSuccess({ banner }, 201);
}
