import { apiError, apiSuccess } from "@/lib/api-response";
import { cronAuthDebug, isCronAuthorized } from "@/lib/cron-auth";
import { log } from "@/lib/logger";
import {
  formatDailyCapLabel,
  getMaxDailyNews,
  getPerRunIngestQuota,
} from "@/lib/news/daily-cap";
import { isVercelRuntime } from "@/lib/news/ingest-budget";
import { ingestDailyNews } from "@/lib/news/ingest";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

/** 매일 07:00·12:00 (호치민) — Vercel Cron `0 0`·`0 5` UTC 또는 수동 호출 */
export async function GET(request: Request) {
  if (!isCronAuthorized(request)) {
    log("warn", "cron news unauthorized", cronAuthDebug(request));
    return apiError("Unauthorized", 401);
  }

  try {
    const dailyCap = getMaxDailyNews();
    const result = await ingestDailyNews({ triggeredBy: "cron" });
    return apiSuccess({
      message: `뉴스 수집 완료: ${result.inserted}건 추가, ${result.skipped}건 건너뜀`,
      ...result,
      runAt: new Date().toISOString(),
      timezone: "Asia/Ho_Chi_Minh",
      schedule: "매일 07:00·12:00 (Asia/Ho_Chi_Minh)",
      dailyCap: dailyCap ?? "unlimited",
      dailyCapLabel: formatDailyCapLabel(),
      perRunCap: getPerRunIngestQuota(isVercelRuntime()),
    });
  } catch (error) {
    log("error", "cron news ingest failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    const message = error instanceof Error ? error.message : "수집 실패";
    return apiError(message, 500);
  }
}

export async function POST(request: Request) {
  return GET(request);
}
