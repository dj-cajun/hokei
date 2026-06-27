import { enforcePreset } from "@/lib/api/enforce-rate-limit";
import { apiError, apiSuccess } from "@/lib/api-response";
import { writeAdminAudit } from "@/lib/admin/audit-log";
import { requireAdminApi } from "@/lib/admin/require-admin-api";
import { partnerStoreToPrismaData } from "@/lib/partner/admin-map";
import { assertCommentPostIdForStore } from "@/lib/partner/comment-post";
import {
  extractOwnerEmailFromBody,
  resolveOwnerEmailInput,
} from "@/lib/partner/owner";
import { isPartnerSlugTaken } from "@/lib/partner/queries";
import { revalidatePartnerPublicPaths } from "@/lib/partner/revalidate-paths";
import { partnerStoreCreateSchema } from "@/lib/partner/validate";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const limited = await enforcePreset(request, "general");
  if (limited) return limited;
  const { error } = await requireAdminApi();
  if (error) return error;

  const stores = await prisma.partnerStore.findMany({
    orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }],
    include: { owner: { select: { email: true } } },
  });

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

  const { payload, ownerEmail } = extractOwnerEmailFromBody(body);
  const parsed = partnerStoreCreateSchema.safeParse(payload);
  if (!parsed.success) {
    return apiError(
      parsed.error.issues[0]?.message ?? "입력값이 올바르지 않습니다.",
      400
    );
  }

  if (await isPartnerSlugTaken(parsed.data.slug)) {
    return apiError("이미 사용 중인 slug입니다.", 409);
  }

  if (parsed.data.commentPostId) {
    const checked = await assertCommentPostIdForStore(
      { slug: parsed.data.slug, name: parsed.data.name },
      parsed.data.commentPostId
    );
    if (checked !== null && typeof checked === "object") {
      return apiError(checked.error, 400);
    }
  }

  const ownerResolved = await resolveOwnerEmailInput(ownerEmail);
  if (ownerResolved.action === "error") {
    return apiError(ownerResolved.message, 400);
  }

  const store = await prisma.partnerStore.create({
    data: {
      ...partnerStoreToPrismaData(parsed.data),
      ...(ownerResolved.action === "set"
        ? { ownerId: ownerResolved.ownerId }
        : {}),
    },
  });

  revalidatePartnerPublicPaths(store.slug);

  await writeAdminAudit({
    actorId: session!.user!.id,
    action: "PARTNER_STORE_CREATE",
    targetType: "PartnerStore",
    targetId: store.id,
    metadata: { slug: store.slug, status: store.status },
    request,
  });

  return apiSuccess({ store }, 201);
}
