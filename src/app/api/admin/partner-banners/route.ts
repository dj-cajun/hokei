import { enforcePreset } from "@/lib/api/enforce-rate-limit";
import { apiError, apiSuccess } from "@/lib/api-response";
import { requireAdminApi } from "@/lib/admin/require-admin-api";
import { writeAdminAudit } from "@/lib/admin/audit-log";
import { prisma } from "@/lib/prisma";
import { listPartnerBannersForAdmin } from "@/lib/partner/queries";
import { partnerBannerCreateSchema } from "@/lib/partner/validate";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const limited = await enforcePreset(request, "general");
  if (limited) return limited;
  const { error } = await requireAdminApi();
  if (error) return error;

  const banners = await listPartnerBannersForAdmin();
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
    return apiError(parsed.error.issues[0]?.message ?? "유효하지 않은 입력", 400);
  }

  const store = await prisma.partnerStore.findUnique({
    where: { id: parsed.data.storeId },
    select: { id: true },
  });
  if (!store) return apiError("업소를 찾을 수 없습니다.", 404);

  if (parsed.data.linkSlug?.trim()) {
    const target = await prisma.partnerStore.findUnique({
      where: { slug: parsed.data.linkSlug.trim() },
      select: { id: true },
    });
    if (!target) {
      return apiError("linkSlug에 해당하는 업소가 없습니다.", 400);
    }
  }

  const created = await prisma.partnerBanner.create({
    data: {
      storeId: parsed.data.storeId,
      slot: parsed.data.slot,
      imageUrl: parsed.data.imageUrl.trim(),
      altText: parsed.data.altText?.trim() || null,
      linkSlug: parsed.data.linkSlug?.trim() || null,
      sortOrder: parsed.data.sortOrder,
      isActive: parsed.data.isActive,
      startsAt: parsed.data.startsAt ?? null,
      endsAt: parsed.data.endsAt ?? null,
    },
  });

  await writeAdminAudit({
    actorId: session!.user!.id,
    action: "PARTNER_BANNER_CREATE",
    targetType: "PartnerBanner",
    targetId: created.id,
    request,
  });

  return apiSuccess({ banner: created }, 201);
}
