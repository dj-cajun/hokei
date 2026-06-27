import { revalidatePath } from "next/cache";
import { enforcePreset } from "@/lib/api/enforce-rate-limit";
import { apiError, apiSuccess } from "@/lib/api-response";
import { writeAdminAudit } from "@/lib/admin/audit-log";
import { requireAdminApi } from "@/lib/admin/require-admin-api";
import {
  nullIfEmpty,
  partnerStoreToPrismaData,
} from "@/lib/partner/admin-map";
import {
  extractOwnerEmailFromBody,
  resolveOwnerEmailInput,
} from "@/lib/partner/owner";
import { isPartnerSlugTaken } from "@/lib/partner/queries";
import { partnerStoreUpdateSchema } from "@/lib/partner/validate";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

function revalidatePartnerPaths(...slugs: (string | undefined)[]) {
  revalidatePath("/");
  revalidatePath("/partners");
  for (const slug of slugs) {
    if (slug) revalidatePath(`/store/${slug}`);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const limited = await enforcePreset(request, "general");
  if (limited) return limited;
  const { session, error } = await requireAdminApi();
  if (error) return error;

  const { id } = await context.params;
  const existing = await prisma.partnerStore.findUnique({ where: { id } });
  if (!existing) {
    return apiError("업소를 찾을 수 없습니다.", 404);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("잘못된 JSON입니다.", 400);
  }

  const { payload, ownerEmail } = extractOwnerEmailFromBody(body);
  const parsed = partnerStoreUpdateSchema.safeParse(payload);
  if (!parsed.success) {
    return apiError(
      parsed.error.issues[0]?.message ?? "입력값이 올바르지 않습니다.",
      400
    );
  }

  const ownerResolved = await resolveOwnerEmailInput(ownerEmail);
  if (ownerResolved.action === "error") {
    return apiError(ownerResolved.message, 400);
  }

  if (parsed.data.slug && parsed.data.slug !== existing.slug) {
    if (await isPartnerSlugTaken(parsed.data.slug, id)) {
      return apiError("이미 사용 중인 slug입니다.", 409);
    }
  }

  const merged = {
    name: parsed.data.name ?? existing.name,
    slug: parsed.data.slug ?? existing.slug,
    tagline:
      parsed.data.tagline !== undefined
        ? nullIfEmpty(parsed.data.tagline)
        : existing.tagline,
    introText:
      parsed.data.introText !== undefined
        ? nullIfEmpty(parsed.data.introText)
        : existing.introText,
    description:
      parsed.data.description !== undefined
        ? nullIfEmpty(parsed.data.description)
        : existing.description,
    menuText:
      parsed.data.menuText !== undefined
        ? nullIfEmpty(parsed.data.menuText)
        : existing.menuText,
    category: parsed.data.category ?? existing.category,
    phone:
      parsed.data.phone !== undefined
        ? nullIfEmpty(parsed.data.phone)
        : existing.phone,
    kakaoLink:
      parsed.data.kakaoLink !== undefined
        ? nullIfEmpty(parsed.data.kakaoLink)
        : existing.kakaoLink,
    mapsUrl:
      parsed.data.mapsUrl !== undefined
        ? nullIfEmpty(parsed.data.mapsUrl)
        : existing.mapsUrl,
    address:
      parsed.data.address !== undefined
        ? nullIfEmpty(parsed.data.address)
        : existing.address,
    locationTips:
      parsed.data.locationTips !== undefined
        ? nullIfEmpty(parsed.data.locationTips)
        : existing.locationTips,
    hoursText:
      parsed.data.hoursText !== undefined
        ? nullIfEmpty(parsed.data.hoursText)
        : existing.hoursText,
    commentPostId:
      parsed.data.commentPostId !== undefined
        ? nullIfEmpty(parsed.data.commentPostId ?? undefined)
        : existing.commentPostId,
    thumbnail:
      parsed.data.thumbnail !== undefined
        ? nullIfEmpty(parsed.data.thumbnail)
        : existing.thumbnail,
    plan: parsed.data.plan ?? existing.plan,
    status: parsed.data.status ?? existing.status,
    sortOrder: parsed.data.sortOrder ?? existing.sortOrder,
    publishedAt:
      parsed.data.publishedAt !== undefined
        ? parsed.data.publishedAt
        : existing.publishedAt,
    expiresAt:
      parsed.data.expiresAt !== undefined
        ? parsed.data.expiresAt
        : existing.expiresAt,
  };

  const store = await prisma.partnerStore.update({
    where: { id },
    data: {
      ...partnerStoreToPrismaData(merged),
      ...(ownerResolved.action === "set"
        ? { ownerId: ownerResolved.ownerId }
        : {}),
      ...(ownerResolved.action === "clear" ? { ownerId: null } : {}),
    },
  });

  revalidatePartnerPaths(existing.slug, store.slug);

  await writeAdminAudit({
    actorId: session!.user!.id,
    action: "PARTNER_STORE_UPDATE",
    targetType: "PartnerStore",
    targetId: id,
    metadata: { slug: store.slug, status: store.status },
    request,
  });

  return apiSuccess({ store });
}

export async function DELETE(request: Request, context: RouteContext) {
  const limited = await enforcePreset(request, "general");
  if (limited) return limited;
  const { session, error } = await requireAdminApi();
  if (error) return error;

  const { id } = await context.params;
  const existing = await prisma.partnerStore.findUnique({ where: { id } });
  if (!existing) {
    return apiError("업소를 찾을 수 없습니다.", 404);
  }

  await prisma.partnerStore.delete({ where: { id } });
  revalidatePartnerPaths(existing.slug);

  await writeAdminAudit({
    actorId: session!.user!.id,
    action: "PARTNER_STORE_DELETE",
    targetType: "PartnerStore",
    targetId: id,
    metadata: { slug: existing.slug },
    request,
  });

  return apiSuccess({ deleted: true });
}
