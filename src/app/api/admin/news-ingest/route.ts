import { auth } from "@/auth";
import { enforcePreset } from "@/lib/api/enforce-rate-limit";
import { apiError, apiSuccess } from "@/lib/api-response";
import { log } from "@/lib/logger";
import { writeAdminAudit } from "@/lib/admin/audit-log";
import { ingestDailyNews } from "@/lib/news/ingest";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

/** 관리자 수동 뉴스 수집 */
export async function POST(request: Request) {
  const limited = await enforcePreset(request, "general");
  if (limited) return limited;

  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return apiError("권한이 없습니다.", 403);
  }

  try {
    const result = await ingestDailyNews({
      triggeredBy: `admin:${session.user.id}`,
    });
    await writeAdminAudit({
      actorId: session.user.id,
      action: "NEWS_INGEST_MANUAL",
      metadata: {
        inserted: result.inserted,
        skipped: result.skipped,
      },
      request,
    });
    return apiSuccess({
      message: `뉴스 수집 완료: ${result.inserted}건 추가`,
      ...result,
    });
  } catch (error) {
    log("error", "admin news-ingest failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    const message = error instanceof Error ? error.message : "수집 실패";
    return apiError(message, 500);
  }
}
