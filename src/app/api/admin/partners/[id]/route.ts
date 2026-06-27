import { enforcePreset } from "@/lib/api/enforce-rate-limit";
import { apiError, apiSuccess } from "@/lib/api-response";
import { requireAdminApi } from "@/lib/admin/require-admin-api";
import { writeAdminAudit } from "@/lib/admin/audit-log";
import { prisma } from "@/lib/prisma";
import { isPartnerSlugTaken } from "@/lib/partner/queries";
import { partnerStoreUpdateSchema } from "@/lib/partner/validate";

type RouteContext = { params: Promise<{ id: string }> };

export const dynamic = "force-dynamic";

function normalizeOptional(value: string | undefined | null): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

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

  const parsed = partnerStoreUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? "유효하지 않은 입력", 400);
  }

  const existing = await prisma.partnerStore.findUnique({ where: { id } });
  if (!existing) return apiError("업소를 찾을 수 없습니다.", 404);

  if (parsed.data.slug && parsed.data.slug !== existing.slug) {
    if (await isPartnerSlugTaken(parsed.data.slug, id)) {
      return apiError("이미 사용 중인 slug입니다.", 409);
    }
  }

  const nextStatus = parsed.data.status ?? existing.status;
  let publishedAt = existing.publishedAt;
  if (nextStatus === "PUBLISHED" && !publishedAt) {
    publishedAt = parsed.data.publishedAt ?? new Date();
  } else if (nextStatus !== "PUBLISHED") {
    publishedAt = parsed.data.publishedAt ?? null;
  } else if (parsed.data.publishedAt !== undefined) {
    publishedAt = parsed.data.publishedAt;
  }

  const updated = await prisma.partnerStore.update({
    where: { id },
    data: {
      ...(parsed.data.name !== undefined ? { name: parsed.data.name.trim() } : {}),
      ...(parsed.data.slug !== undefined ? { slug: parsed.data.slug.trim() } : {}),
      ...(parsed.data.tagline !== undefined
        ? { tagline: normalizeOptional(parsed.data.tagline) }
        : {}),
      ...(parsed.data.description !== undefined
        ? { description: normalizeOptional(parsed.data.description) }
        : {}),
      ...(parsed.data.category !== undefined ? { category: parsed.data.category } : {}),
      ...(parsed.data.phone !== undefined
        ? { phone: normalizeOptional(parsed.data.phone) }
        : {}),
      ...(parsed.data.kakaoLink !== undefined
        ? { kakaoLink: normalizeOptional(parsed.data.kakaoLink) }
        : {}),
      ...(parsed.data.mapsUrl !== undefined
        ? { mapsUrl: normalizeOptional(parsed.data.mapsUrl) }
        : {}),
      ...(parsed.data.address !== undefined
        ? { address: normalizeOptional(parsed.data.address) }
        : {}),
      ...(parsed.data.hoursText !== undefined
        ? { hoursText: normalizeOptional(parsed.data.hoursText) }
        : {}),
      ...(parsed.data.thumbnail !== undefined
        ? { thumbnail: normalizeOptional(parsed.data.thumbnail) }
        : {}),
      ...(parsed.data.plan !== undefined ? { plan: parsed.data.plan } : {}),
      ...(parsed.data.status !== undefined ? { status: parsed.data.status } : {}),
      ...(parsed.data.sortOrder !== undefined ? { sortOrder: parsed.data.sortOrder } : {}),
      publishedAt,
      ...(parsed.data.expiresAt !== undefined
        ? { expiresAt: parsed.data.expiresAt }
        : {}),
    },
  });

  await writeAdminAudit({
    actorId: session!.user!.id,
    action: "PARTNER_STORE_UPDATE",
    targetType: "PartnerStore",
    targetId: id,
    metadata: parsed.data,
    request,
  });

  return apiSuccess({ store: updated });
}

export async function DELETE(request: Request, context: RouteContext) {
  const limited = await enforcePreset(request, "general");
  if (limited) return limited;
  const { session, error } = await requireAdminApi();
  if (error) return error;

  const { id } = await context.params;
  const existing = await prisma.partnerStore.findUnique({ where: { id } });
  if (!existing) return apiError("업소를 찾을 수 없습니다.", 404);

  await prisma.partnerStore.delete({ where: { id } });

  await writeAdminAudit({
    actorId: session!.user!.id,
    action: "PARTNER_STORE_DELETE",
    targetType: "PartnerStore",
    targetId: id,
    request,
  });

  return apiSuccess({ deleted: true });
}
