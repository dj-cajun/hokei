import { VERCEL_MAX_BODY_ATTEMPTS } from "@/lib/news/ingest-budget";

/** 과거 기본값 (NEWS_DAILY_CAP=15 로 복구 가능) */
export const LEGACY_DEFAULT_DAILY_CAP = 15;

const LOCAL_DEFAULT_PER_RUN = 40;

/**
 * 일일 수집 상한 — `NEWS_DAILY_CAP`
 * - 미설정 · "" · "0" → **무제한** (일일 상한 없음)
 * - 양수 → 호치민 기준 하루 최대 건수
 */
export function getMaxDailyNews(): number | null {
  const raw = process.env.NEWS_DAILY_CAP?.trim();
  if (raw === undefined || raw === "" || raw === "0") {
    return null;
  }
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n <= 0) {
    return null;
  }
  return n;
}

export function isDailyNewsCapEnabled(): boolean {
  return getMaxDailyNews() !== null;
}

/**
 * 일일 상한이 없을 때 1회 수집(run)당 시도·삽입 상한 — `NEWS_PER_RUN_CAP`
 * Vercel Cron은 120초 budget 때문에 기본 15건.
 */
export function getPerRunIngestQuota(onVercel: boolean): number {
  const raw = process.env.NEWS_PER_RUN_CAP?.trim();
  if (raw) {
    const n = Number.parseInt(raw, 10);
    if (Number.isFinite(n) && n > 0) {
      return onVercel ? Math.min(n, 30) : n;
    }
  }
  return onVercel ? VERCEL_MAX_BODY_ATTEMPTS : LOCAL_DEFAULT_PER_RUN;
}

export function formatDailyCapLabel(): string {
  const cap = getMaxDailyNews();
  return cap === null ? "무제한" : `${cap}건/일`;
}
