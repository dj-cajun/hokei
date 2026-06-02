import { NextResponse } from "next/server";
import { enforcePreset } from "@/lib/api/enforce-rate-limit";
import { kakaoCallbackBridgeHtml } from "@/lib/auth/kakao-callback-bridge";
import { getKakaoRedirectUri } from "@/lib/auth/kakao-redirect-uri";
import { decodeKakaoOAuthState } from "@/lib/auth/kakao-state";

/**
 * 카카오 OAuth redirect (GET).
 * App Router GET Route Handler에서는 세션 쿠키를 쓸 수 없어,
 * POST /api/auth/kakao/complete 로 넘기는 HTML 브릿지를 반환합니다.
 */
export async function GET(request: Request) {
  const limited = await enforcePreset(request, "login");
  if (limited) return limited;

  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const origin = new URL(request.url).origin;
  const redirectUri = getKakaoRedirectUri(origin);

  if (error) {
    return NextResponse.redirect(
      new URL(`/?login_error=kakao_${error}`, request.url)
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL("/?login_error=kakao_no_code", request.url)
    );
  }

  const afterLogin = decodeKakaoOAuthState(searchParams.get("state"));

  const html = kakaoCallbackBridgeHtml({
    code,
    redirectUri,
    callbackUrl: afterLogin,
  });

  return new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
