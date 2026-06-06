import { NextResponse } from "next/server";

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export type RateLimitPreset = keyof typeof RATE_LIMIT_PRESETS;

/** IP 기반 슬라이딩 윈도우 Rate Limiter 프리셋 */
export const RATE_LIMIT_PRESETS = {
  signup: { windowMs: 60_000 * 15, maxRequests: 5 },
  login: { windowMs: 60_000 * 15, maxRequests: 10 },
  upload: { windowMs: 60_000, maxRequests: 10 },
  uploadGuest: { windowMs: 60_000 * 60, maxRequests: 15 },
  comment: { windowMs: 60_000, maxRequests: 20 },
  post: { windowMs: 60_000 * 5, maxRequests: 5 },
  search: { windowMs: 60_000, maxRequests: 30 },
  general: { windowMs: 60_000, maxRequests: 60 },
  report: { windowMs: 60_000 * 15, maxRequests: 10 },
  /** 쪽지 대화 시작 */
  dmCreate: { windowMs: 60_000 * 15, maxRequests: 10 },
  /** 쪽지 전송 */
  dmSend: { windowMs: 60_000, maxRequests: 30 },
  /** 댓글 수정·삭제 (시간당) */
  commentsPatch: { windowMs: 60_000 * 60, maxRequests: 30 },
  commentsDelete: { windowMs: 60_000 * 60, maxRequests: 20 },
  postsPatch: { windowMs: 60_000 * 60, maxRequests: 30 },
  postsDelete: { windowMs: 60_000 * 60, maxRequests: 20 },
} as const;

/** Returns true if allowed, false if rate limited. */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (bucket.count >= limit) return false;
  bucket.count += 1;
  return true;
}

/** 시도 허용 여부만 확인 (카운트 증가 없음) */
export function peekRateLimit(
  key: string,
  limit: number,
  _windowMs?: number
): boolean {
  void _windowMs;
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || now > bucket.resetAt) return true;
  return bucket.count < limit;
}

/** 실패한 시도 1회 기록 */
export function recordRateLimitFailure(
  key: string,
  limit: number,
  windowMs: number
): void {
  checkRateLimit(key, limit, windowMs);
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

export async function isRateLimitAllowed(
  key: string,
  preset: RateLimitPreset
): Promise<boolean> {
  const { maxRequests, windowMs } = RATE_LIMIT_PRESETS[preset];
  const { isUpstashRateLimitEnabled, checkDistributedRateLimit } =
    await import("@/lib/rate-limit-distributed");

  if (isUpstashRateLimitEnabled()) {
    return checkDistributedRateLimit(key, preset);
  }
  return checkRateLimit(key, maxRequests, windowMs);
}

export async function enforceRateLimitPreset(
  request: Request,
  preset: RateLimitPreset
): Promise<NextResponse | null> {
  const ip = getClientIp(request);
  const { isIpBlocked } = await import("@/lib/admin/ip-block");
  if (await isIpBlocked(ip)) {
    return NextResponse.json(
      { ok: false, error: "접근이 제한된 IP입니다." },
      { status: 403 }
    );
  }
  const key = `${preset}:${ip}`;
  if (!(await isRateLimitAllowed(key, preset))) {
    return NextResponse.json(
      { ok: false, error: "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요." },
      { status: 429 }
    );
  }
  return null;
}

/** RSC 검색 페이지용 (headers 기반 IP) */
export function enforceSearchRateLimitByIp(ip: string): boolean {
  const { maxRequests, windowMs } = RATE_LIMIT_PRESETS.search;
  return checkRateLimit(`search:${ip}`, maxRequests, windowMs);
}

/** 검색 페이지 — Upstash 설정 시 분산 제한 */
export async function enforceSearchRateLimitByIpAsync(
  ip: string
): Promise<boolean> {
  return isRateLimitAllowed(`search:${ip}`, "search");
}
