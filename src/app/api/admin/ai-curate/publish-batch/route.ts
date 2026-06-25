import { enforcePreset } from "@/lib/api/enforce-rate-limit";
import { apiError, apiSuccess } from "@/lib/api-response";
import { writeAdminAudit } from "@/lib/admin/audit-log";
import { publishCuratedItemsBatch } from "@/lib/admin/publish-curated-batch";
import { requireAdminApi } from "@/lib/admin/require-admin-api";
import { curateKakaoPublishBatchSchema } from "@/lib/ai/curate-kakao-schemas";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

/** 신규 추출 항목만 타임라인·게시판에 일괄 반영 */
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

  const parsed = curateKakaoPublishBatchSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? "입력값 오류", 400);
  }

  try {
    const result = await publishCuratedItemsBatch(
      parsed.data.items,
      session!.user!.id
    );

    if (result.published.length > 0 || result.updated.length > 0) {
      await writeAdminAudit({
        actorId: session!.user!.id,
        action: "AI_CURATE_PUBLISH_BATCH",
        metadata: {
          published: result.published.length,
          updated: result.updated.length,
          skipped: result.skipped.length,
        },
        request,
      });
    }

    const parts: string[] = [];
    if (result.published.length > 0) {
      parts.push(`신규 ${result.published.length}건`);
    }
    if (result.updated.length > 0) {
      parts.push(`업데이트 ${result.updated.length}건`);
    }

    return apiSuccess({
      ...result,
      message:
        parts.length > 0
          ? `${parts.join(", ")} 타임라인에 반영했습니다.`
          : "반영할 항목이 없습니다.",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "일괄 발행 실패";
    return apiError(message, 400);
  }
}
