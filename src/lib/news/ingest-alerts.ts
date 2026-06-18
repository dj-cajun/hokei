import { log } from "@/lib/logger";
import { prisma } from "@/lib/prisma";

const CONSECUTIVE_ZERO_CRON_THRESHOLD = 3;

/** Cron 연속 0건 수집 시 error 로그 (Sentry 등 연동 가능) */
export async function warnIfConsecutiveZeroCronIngests(
  inserted: number,
  triggeredBy?: string | null
): Promise<void> {
  if (inserted > 0 || triggeredBy !== "cron") return;

  const recent = await prisma.newsIngestRun.findMany({
    where: { triggeredBy: "cron" },
    orderBy: { runAt: "desc" },
    take: CONSECUTIVE_ZERO_CRON_THRESHOLD,
    select: { inserted: true, runAt: true },
  });

  if (
    recent.length >= CONSECUTIVE_ZERO_CRON_THRESHOLD &&
    recent.every((r) => r.inserted === 0)
  ) {
    log("error", "news ingest: consecutive zero cron inserts", {
      runs: recent.length,
      lastRunAt: recent[0]?.runAt.toISOString(),
      hint: "RSS 풀·번역 키·본문 추출(regex_short) 확인 — npm run news:check:prod",
    });
  }
}
