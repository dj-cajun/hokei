import { NextResponse } from "next/server";
import { enforcePreset } from "@/lib/api/enforce-rate-limit";
import { getKakaoRedirectUri } from "@/lib/auth/kakao-oauth";
import { signInWithKakaoCode } from "@/lib/auth/kakao-sign-in";

export async function GET(request: Request) {
  const limited = await enforcePreset(request, "login");
  if (limited) return limited;

  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const origin = new URL(request.url).origin;
  const redirectUri = getKakaoRedirectUri(
    process.env.NEXT_PUBLIC_SITE_URL?.trim() || origin
  );

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

  try {
    await signInWithKakaoCode(code, redirectUri);
    return NextResponse.redirect(new URL("/", request.url));
  } catch (err) {
    const msg =
      err instanceof Error ? err.message : "kakao_login_failed";
    return NextResponse.redirect(
      new URL(`/?login_error=${encodeURIComponent(msg)}`, request.url)
    );
  }
}
