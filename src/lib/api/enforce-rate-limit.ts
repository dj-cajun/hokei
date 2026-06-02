import { NextResponse } from "next/server";
import {
  checkRateLimit,
  enforceRateLimitPreset,
  getClientIp,
  peekRateLimit,
  recordRateLimitFailure,
  type RateLimitPreset,
} from "@/lib/rate-limit";

const GUEST_PASSWORD_LIMIT = 8;
const GUEST_PASSWORD_WINDOW_MS = 15 * 60 * 1000;

export async function enforceRateLimit(
  request: Request,
  scope: string,
  limit: number,
  windowMs: number
): Promise<NextResponse | null> {
  const ip = getClientIp(request);
  if (!checkRateLimit(`${scope}:${ip}`, limit, windowMs)) {
    return NextResponse.json(
      { ok: false, error: "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요." },
      { status: 429 }
    );
  }
  return null;
}

export async function enforcePreset(
  request: Request,
  preset: RateLimitPreset
): Promise<NextResponse | null> {
  return enforceRateLimitPreset(request, preset);
}

function guestPostPasswordKey(request: Request, postId: string): string {
  return `guest-pw:${getClientIp(request)}:${postId}`;
}

function guestCommentPasswordKey(request: Request, commentId: string): string {
  return `guest-comment-pw:${getClientIp(request)}:${commentId}`;
}

/** 비회원 글 비밀번호 — 차단 여부만 확인 (성공 시 카운트 안 올림) */
export function isGuestPasswordBlocked(
  request: Request,
  postId: string
): boolean {
  return !peekRateLimit(
    guestPostPasswordKey(request, postId),
    GUEST_PASSWORD_LIMIT,
    GUEST_PASSWORD_WINDOW_MS
  );
}

export function recordGuestPasswordFailure(
  request: Request,
  postId: string
): void {
  recordRateLimitFailure(
    guestPostPasswordKey(request, postId),
    GUEST_PASSWORD_LIMIT,
    GUEST_PASSWORD_WINDOW_MS
  );
}

export function guestPasswordBlockedResponse(): NextResponse {
  return NextResponse.json(
    {
      ok: false,
      error: "비밀번호 시도 횟수를 초과했습니다. 15분 후 다시 시도해 주세요.",
    },
    { status: 429 }
  );
}

/** @deprecated 성공 요청까지 카운트 — recordGuestPasswordFailure + isGuestPasswordBlocked 사용 */
export function enforceGuestPasswordAttempts(
  request: Request,
  postId: string
): NextResponse | null {
  if (isGuestPasswordBlocked(request, postId)) {
    return guestPasswordBlockedResponse();
  }
  return null;
}

export function isGuestCommentPasswordBlocked(
  request: Request,
  commentId: string
): boolean {
  return !peekRateLimit(
    guestCommentPasswordKey(request, commentId),
    GUEST_PASSWORD_LIMIT,
    GUEST_PASSWORD_WINDOW_MS
  );
}

export function recordGuestCommentPasswordFailure(
  request: Request,
  commentId: string
): void {
  recordRateLimitFailure(
    guestCommentPasswordKey(request, commentId),
    GUEST_PASSWORD_LIMIT,
    GUEST_PASSWORD_WINDOW_MS
  );
}

/** @deprecated */
export function enforceGuestCommentPasswordAttempts(
  request: Request,
  commentId: string
): NextResponse | null {
  if (isGuestCommentPasswordBlocked(request, commentId)) {
    return guestPasswordBlockedResponse();
  }
  return null;
}
