import { enforcePreset } from "@/lib/api/enforce-rate-limit";
import { apiError, apiSuccess } from "@/lib/api-response";
import { requireAdminApi } from "@/lib/admin/require-admin-api";
import { writeAdminAudit } from "@/lib/admin/audit-log";
import { prisma } from "@/lib/prisma";
import {
  isPartnerSlugTaken,
  listPartnerStoresForAdmin,
} from "@/lib/partner/queries";
import {
  resolveUniquePartnerSlug,
} from "@/lib/partner/slug";
import { partnerStoreCreateSchema } from "@/lib/partner/validate";

export const dynamic = "force-dynamic";

function normalizeOptional(value: string | undefined | null): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function buildStoreData(
  data: ReturnType<typeof partnerStoreCreateSchema.parse>,
  publishedAt: Date | null
) {
  return {
    name: data.name.trim(),
    slug: data.slug.trim(),
    tagline: normalizeOptional(data.tagline),
    description: normalizeOptional(data.description),
    category: data.category,
    phone: normalizeOptional(data.phone),
    kakaoLink: normalizeOptional(data.kakaoLink),
    mapsUrl: normalizeOptional(data.mapsUrl),
    address: normalizeOptional(data.address),
    hoursText: normalizeOptional(data.hoursText),
    thumbnail: normalizeOptional(data.thumbnail),
    plan: data.plan,
    status: data.status,
    sortOrder: data.sortOrder,
    publishedAt,
    expiresAt: data.expiresAt ?? null,
  };
}

export async function GET(request: Request) {
  const limited = await enforcePreset(request, "general");
  if (limited) return limited;
  const { error } = await requireAdminApi();
  if (error) return error;

  const stores = await listPartnerStoresForAdmin();
  return apiSuccess({ stores });
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

  const parsed = partnerStoreCreateSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? "유효하지 않은 입력", 400);
  }

  let slug = parsed.data.slug.trim();
  if (!slug) {
    slug = await resolveUniquePartnerSlug(parsed.data.name, (candidate) =>
      isPartnerSlugTaken(candidate)
    );
  } else if (await isPartnerSlugTaken(slug)) {
    return apiError("이미 사용 중인 slug입니다.", 409);
  }

  const publishedAt =
    parsed.data.status === "PUBLISHED"
      ? (parsed.data.publishedAt ?? new Date())
      : null;

  const created = await prisma.partnerStore.create({
    data: buildStoreData({ ...parsed.data, slug }, publishedAt),
  });

  await writeAdminAudit({
    actorId: session!.user!.id,
    action: "PARTNER_STORE_CREATE",
    targetType: "PartnerStore",
    targetId: created.id,
    request,
  });

  return apiSuccess({ store: created }, 201);
}
