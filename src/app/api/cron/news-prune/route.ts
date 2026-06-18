import { apiError, apiSuccess } from "@/lib/api-response";
import { cronAuthDebug, isCronAuthorized } from "@/lib/cron-auth";
import { log } from "@/lib/logger";
import { pruneEmptyContentAutomatedNews } from "@/lib/news/prune-empty-content-news";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** 매주 일요일 13:00 ICT — 본문 없는 자동 뉴스 정리 (vercel.json `0 6 * * 0` UTC) */
export async function GET(request: Request) {
  if (!isCronAuthorized(request)) {
    log("warn", "cron news-prune unauthorized", cronAuthDebug(request));
    return apiError("Unauthorized", 401);
  }

  try {
    const result = await pruneEmptyContentAutomatedNews();
    return apiSuccess({
      message: `빈 본문 자동 뉴스 ${result.removed}건 삭제 (검사 ${result.checked}건)`,
      ...result,
      runAt: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "정리 실패";
    log("error", "cron news-prune failed", { error: message });
    return apiError(message, 500);
  }
}

export async function POST(request: Request) {
  return GET(request);
}
