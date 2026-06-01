import { NextResponse } from "next/server";

export function apiError(message: string, status: number) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

/** 기존 클라이언트 호환: 최상위 필드 + ok */
export function apiSuccess<T extends Record<string, unknown>>(
  payload: T,
  status = 200
) {
  return NextResponse.json({ ok: true, ...payload }, { status });
}

export function parseApiError(data: unknown): string | undefined {
  if (data && typeof data === "object" && "error" in data) {
    const err = (data as { error?: unknown }).error;
    if (typeof err === "string") return err;
  }
  return undefined;
}
