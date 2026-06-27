import { revalidatePath } from "next/cache";
import { enforcePreset } from "@/lib/api/enforce-rate-limit";
import { apiError, apiSuccess } from "@/lib/api-response";
import { writeAdminAudit } from "@/lib/admin/audit-log";
import { requireAdminApi } from "@/lib/admin/require-admin-api";
import { partnerStoreToPrismaData } from "@/lib/partner/admin-map";
import { isPartnerSlugTaken } from "@/lib/partner/queries";
import { partnerStoreCreateSchema } from "@/lib/partner/validate";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function revalidatePartnerPaths(slug?: string) {
  revalidatePath("/partners");
  if (slug) {
    revalidatePath(`/store/${slug}`);
  }
}

export async function GET(request: Request) {
  const limited = await enforcePreset(request, "general");
  if (limited) return limited;
  const { error } = await requireAdminApi();
  if (error) return error;

  const stores = await prisma.partnerStore.findMany({
    orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }],
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

  const parsed = partnerStoreCreateSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(
      parsed.error.issues[0]?.message ?? "입력값이 올바르지 않습니다.",
      400
    );
  }

  if (await isPartnerSlugTaken(parsed.data.slug)) {
    return apiError("이미 사용 중인 slug입니다.", 409);
  }

  const store = await prisma.partnerStore.create({
    data: partnerStoreToPrismaData(parsed.data),
  });

  revalidatePartnerPaths(store.slug);

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
