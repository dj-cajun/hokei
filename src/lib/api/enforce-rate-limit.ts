import { NextResponse } from "next/server";
import {
  checkRateLimit,
  enforceRateLimitPreset,
  getClientIp,
  type RateLimitPreset,
} from "@/lib/rate-limit";

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

/** 비회원 글 수정·삭제 비밀번호 시도 제한 */
export function enforceGuestPasswordAttempts(
  request: Request,
  postId: string
): NextResponse | null {
  const ip = getClientIp(request);
  const key = `guest-pw:${ip}:${postId}`;
  if (!checkRateLimit(key, 8, 15 * 60 * 1000)) {
    return NextResponse.json(
      {
        ok: false,
        error: "비밀번호 시도 횟수를 초과했습니다. 15분 후 다시 시도해 주세요.",
      },
      { status: 429 }
    );
  }
  return null;
}

/** 비회원 댓글 수정·삭제 비밀번호 시도 제한 */
export function enforceGuestCommentPasswordAttempts(
  request: Request,
  commentId: string
): NextResponse | null {
  const ip = getClientIp(request);
  const key = `guest-comment-pw:${ip}:${commentId}`;
  if (!checkRateLimit(key, 8, 15 * 60 * 1000)) {
    return NextResponse.json(
      {
        ok: false,
        error: "비밀번호 시도 횟수를 초과했습니다. 15분 후 다시 시도해 주세요.",
      },
      { status: 429 }
    );
  }
  return null;
}
