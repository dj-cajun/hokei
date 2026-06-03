import { NextResponse } from "next/server";
import { encodeKakaoOAuthState } from "@/lib/auth/kakao-state";
import { getKakaoRedirectUri } from "@/lib/auth/kakao-redirect-uri";
import { safeCallbackPath } from "@/lib/auth/safe-callback-url";

/**
 * 카카오 로그인 시작 (서버 redirect)
 * REST API 키 + redirect_uri — JS SDK authorize 400(KOE006 등) 회피
 */
export async function GET(request: Request) {
  const restKey = process.env.KAKAO_REST_API_KEY?.trim();
  if (!restKey) {
    return NextResponse.json(
      { error: "KAKAO_REST_API_KEY가 설정되지 않았습니다." },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(request.url);
  const callbackUrl = safeCallbackPath(searchParams.get("callbackUrl"));
  const origin = new URL(request.url).origin;
  const redirectUri = getKakaoRedirectUri(origin);

  if (!redirectUri) {
    return NextResponse.redirect(
      new URL("/?login_error=kakao_redirect_uri", request.url)
    );
  }

  const authorize = new URL("https://kauth.kakao.com/oauth/authorize");
  authorize.searchParams.set("client_id", restKey);
  authorize.searchParams.set("redirect_uri", redirectUri);
  authorize.searchParams.set("response_type", "code");
  authorize.searchParams.set("scope", "profile_nickname,account_email");

  const state = encodeKakaoOAuthState(callbackUrl);
  if (state) {
    authorize.searchParams.set("state", state);
  }

  return NextResponse.redirect(authorize.toString());
}
