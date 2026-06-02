import { AuthError } from "next-auth";
import { signIn } from "@/auth";
import { KakaoAccountLinkError } from "@/lib/auth/kakao-account";
import { getKakaoRedirectUri } from "@/lib/auth/kakao-redirect-uri";

type KakaoSignInOptions = {
  /** POST Route Handler: false 후 NextResponse.redirect 권장 */
  redirect?: boolean;
  redirectTo?: string;
};

/**
 * 카카오 code로 NextAuth 세션 발급.
 * POST Route Handler에서 호출합니다.
 */
export async function signInWithKakaoCode(
  code: string,
  redirectUri?: string,
  redirectTo: string = "/",
  options: KakaoSignInOptions = {}
): Promise<void> {
  const uri = redirectUri ?? getKakaoRedirectUri();
  if (!uri) {
    throw new Error("카카오 Redirect URI가 설정되지 않았습니다.");
  }

  const useRedirect = options.redirect ?? false;
  const destination = options.redirectTo ?? redirectTo;

  try {
    if (useRedirect) {
      await signIn("kakao-code", {
        code,
        redirectUri: uri,
        redirectTo: destination,
        redirect: true,
      });
      return;
    }

    const result = await signIn("kakao-code", {
      code,
      redirectUri: uri,
      redirectTo: destination,
      redirect: false,
    });

    if (result?.error) {
      throw new Error("카카오 로그인에 실패했습니다.");
    }
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
