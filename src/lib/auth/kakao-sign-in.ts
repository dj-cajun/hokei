import { AuthError } from "next-auth";
import { signIn } from "@/auth";
import { KakaoAccountLinkError } from "@/lib/auth/kakao-account";
import { getKakaoRedirectUri } from "@/lib/auth/kakao-redirect-uri";

/**
 * 카카오 code로 NextAuth 세션 발급.
 * POST Route Handler에서만 호출 — redirect: true로 Set-Cookie 후 이동합니다.
 */
export async function signInWithKakaoCode(
  code: string,
  redirectUri?: string,
  redirectTo: string = "/"
): Promise<void> {
  const uri = redirectUri ?? getKakaoRedirectUri();
  if (!uri) {
    throw new Error("카카오 Redirect URI가 설정되지 않았습니다.");
  }

  try {
    await signIn("kakao-code", {
      code,
      redirectUri: uri,
      redirectTo,
      redirect: true,
    });
  } catch (err) {
    if (err instanceof KakaoAccountLinkError) {
      throw err;
    }
    if (err instanceof AuthError) {
      throw new Error(err.message || "카카오 로그인에 실패했습니다.");
    }
    throw err;
  }
}
