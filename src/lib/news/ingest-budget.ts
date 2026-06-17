/**
 * Vercel Cron(120s) 안에 본문 추출 루프가 끝나도록 시도·타임아웃·deadline 제한.
 * @see vercel.json maxDuration on /api/cron/news
 */

/** Vercel 함수 maxDuration (초) — vercel.json과 맞출 것 */
export const VERCEL_CRON_MAX_DURATION_SEC = 120;

/** RSS·DB·prune 등 예비 시간을 뺀 본문 추출 phase budget */
export const VERCEL_BODY_PHASE_DEADLINE_MS = 90_000;

/** Vercel: 후보당 fetch 타임아웃 (ms) */
export const VERCEL_FETCH_TIMEOUT_MS = 6_000;

/** 로컬·관리자 수동: 여유 있는 fetch 타임아웃 */
export const LOCAL_FETCH_TIMEOUT_MS = 12_000;

/** Vercel Cron: 본문 추출 최대 시도 건수 (remaining과 무관 상한) */
export const VERCEL_MAX_BODY_ATTEMPTS = 10;

/** 로컬: 스킵 대비 배수 */
export const LOCAL_ATTEMPT_MULTIPLIER = 4;

export function isVercelRuntime(): boolean {
  return process.env.VERCEL === "1";
}

export function getIngestFetchTimeoutMs(): number {
  return isVercelRuntime() ? VERCEL_FETCH_TIMEOUT_MS : LOCAL_FETCH_TIMEOUT_MS;
}

/** 본문 추출 루프에 넣을 후보 상한 */
export function computeBodyAttemptBudget(
  candidateCount: number,
  remainingQuota: number,
  onVercel = isVercelRuntime()
): number {
  if (candidateCount <= 0 || remainingQuota <= 0) return 0;

  if (onVercel) {
    return Math.min(
      candidateCount,
      remainingQuota,
      VERCEL_MAX_BODY_ATTEMPTS
    );
  }

  return Math.min(
    candidateCount,
    Math.max(remainingQuota, remainingQuota * LOCAL_ATTEMPT_MULTIPLIER)
  );
}

/** 본문 phase가 deadline을 넘었는지 */
export function isBodyPhasePastDeadline(
  phaseStartedAtMs: number,
  nowMs = Date.now(),
  onVercel = isVercelRuntime()
): boolean {
  if (!onVercel) return false;
  return nowMs - phaseStartedAtMs >= VERCEL_BODY_PHASE_DEADLINE_MS;
}
