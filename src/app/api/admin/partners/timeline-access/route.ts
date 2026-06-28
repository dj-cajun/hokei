import { z } from "zod";
import { enforcePreset } from "@/lib/api/enforce-rate-limit";
import { apiError, apiSuccess } from "@/lib/api-response";
import { writeAdminAudit } from "@/lib/admin/audit-log";
import { requireAdminApi } from "@/lib/admin/require-admin-api";
import {
  grantPartnerStoreTimelineAccess,
  revokePartnerStoreTimelineAccess,
} from "@/lib/partner/timeline-access-admin";

export const dynamic = "force-dynamic";

const bodySchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("grant"),
    userAccount: z.string().min(1, "회원 ID 또는 이메일을 입력해 주세요."),
    storeUrl: z.string().min(1, "업소 페이지 주소를 입력해 주세요."),
  }),
  z.object({
    action: z.literal("revoke"),
    storeUrl: z.string().min(1, "업소 페이지 주소를 입력해 주세요."),
  }),
]);

/** 업소 LP 타임라인 글쓰기 권한 — ownerId 부여·해제 */
export async function POST(request: Request) {
  const limited = await enforcePreset(request, "general");
  if (limited) return limited;

  const { session, error } = await requireAdminApi();
  if (error) return error;

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return apiError("잘못된 JSON입니다.", 400);
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return apiError(
      parsed.error.issues[0]?.message ?? "입력값이 올바르지 않습니다.",
      400
    );
  }

  const result =
    parsed.data.action === "grant"
      ? await grantPartnerStoreTimelineAccess(
          parsed.data.storeUrl,
          parsed.data.userAccount
        )
      : await revokePartnerStoreTimelineAccess(parsed.data.storeUrl);

  if (!result.ok) {
    return apiError(result.message, 400);
  }

  await writeAdminAudit({
    actorId: session!.user!.id,
    action:
      parsed.data.action === "grant"
        ? "PARTNER_TIMELINE_ACCESS_GRANT"
        : "PARTNER_TIMELINE_ACCESS_REVOKE",
    targetType: "PartnerStore",
    targetId: result.store.id,
    metadata: {
      storeSlug: result.store.slug,
      userId: result.user?.id ?? null,
      userEmail: result.user?.email ?? null,
    },
    request,
  });

  return apiSuccess({
    store: result.store,
    user: result.user,
    message:
      parsed.data.action === "grant"
        ? `${result.store.name} 타임라인 글쓰기 권한을 부여했습니다.`
        : `${result.store.name} 타임라인 글쓰기 권한을 해제했습니다.`,
  });
}
