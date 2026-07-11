import { apiError, apiSuccess } from "@/lib/api-response";
import { cronAuthDebug, isCronAuthorized } from "@/lib/cron-auth";
import { runWeeklySettlement } from "@/lib/coupon/server/settlements";
import { log } from "@/lib/logger";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

/** 매주 월요일 00:00 (Asia/Ho_Chi_Minh) — Vercel Cron 또는 수동 호출 */
export async function GET(request: Request) {
  if (!isCronAuthorized(request)) {
    log("warn", "cron coupon settle-weekly unauthorized", cronAuthDebug(request));
    return apiError("Unauthorized", 401);
  }

  try {
    const result = await runWeeklySettlement(true);
    return apiSuccess({
      message: "쿠폰 주간 정산 완료",
      ...result,
      runAt: new Date().toISOString(),
      timezone: "Asia/Ho_Chi_Minh",
    });
  } catch (error) {
    log("error", "cron coupon settle-weekly failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    const message = error instanceof Error ? error.message : "정산 실패";
    return apiError(message, 500);
  }
}

export async function POST(request: Request) {
  return GET(request);
}
