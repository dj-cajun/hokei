import { NextResponse } from "next/server";
import { enforcePreset } from "@/lib/api/enforce-rate-limit";
import { getKakaoRedirectUri } from "@/lib/auth/kakao-redirect-uri";
import { KakaoAccountLinkError } from "@/lib/auth/kakao-account";
import { signInWithKakaoCode } from "@/lib/auth/kakao-sign-in";
import { safeCallbackPath } from "@/lib/auth/safe-callback-url";

/**
 * 카카오 code → NextAuth 세션 (POST에서만 쿠키 발급 가능)
 * GET /api/auth/kakao/callback 브릿지 HTML이 form POST로 호출합니다.
 */
export async function POST(request: Request) {
  const limited = await enforcePreset(request, "login");
  if (limited) return limited;

  let code: string | null = null;
  let redirectUri: string | null = null;
  let callbackUrl = "/";

  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const body = (await request.json()) as {
      code?: string;
      redirectUri?: string;
      callbackUrl?: string;
    };
    code = body.code?.trim() ?? null;
    redirectUri = body.redirectUri?.trim() ?? null;
    callbackUrl = safeCallbackPath(body.callbackUrl);
  } else {
    const form = await request.formData();
    code = form.get("code")?.toString().trim() ?? null;
    redirectUri = form.get("redirectUri")?.toString().trim() ?? null;
    callbackUrl = safeCallbackPath(form.get("callbackUrl")?.toString());
  }

  if (!code) {
    return NextResponse.redirect(
      new URL("/?login_error=kakao_no_code", request.url)
    );
  }

  const origin = new URL(request.url).origin;
  const uri = redirectUri || getKakaoRedirectUri(origin);

  try {
    await signInWithKakaoCode(code, uri, callbackUrl);
  } catch (err) {
    const code =
      err instanceof KakaoAccountLinkError
        ? err.code
        : err instanceof Error
          ? err.message
          : "kakao_login_failed";
    return NextResponse.redirect(
      new URL(`/?login_error=${encodeURIComponent(code)}`, request.url)
    );
  }
}
