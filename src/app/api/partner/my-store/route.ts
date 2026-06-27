import { enforcePreset } from "@/lib/api/enforce-rate-limit";
import { apiError, apiSuccess } from "@/lib/api-response";
import { partnerStoreOwnerToPrismaData } from "@/lib/partner/owner";
import { requirePartnerOwnerApi } from "@/lib/partner/require-partner-owner-api";
import { revalidatePartnerPublicPaths } from "@/lib/partner/revalidate-paths";
import { partnerStoreOwnerUpdateSchema } from "@/lib/partner/validate";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const limited = await enforcePreset(request, "general");
  if (limited) return limited;

  const { store, error } = await requirePartnerOwnerApi();
  if (error) return error;

  return apiSuccess({ store });
}

export async function PATCH(request: Request) {
  const limited = await enforcePreset(request, "general");
  if (limited) return limited;

  const { store, error } = await requirePartnerOwnerApi();
  if (error) return error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("잘못된 JSON입니다.", 400);
  }

  const parsed = partnerStoreOwnerUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(
      parsed.error.issues[0]?.message ?? "입력값이 올바르지 않습니다.",
      400
    );
  }

  const data = partnerStoreOwnerToPrismaData(parsed.data);
  if (Object.keys(data).length === 0) {
    return apiError("수정할 항목이 없습니다.", 400);
  }

  const updated = await prisma.partnerStore.update({
    where: { id: store!.id },
    data,
  });

  revalidatePartnerPublicPaths(updated.slug);

  return apiSuccess({ store: updated });
}
