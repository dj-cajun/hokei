import { AuthError } from "next-auth";
import { signIn } from "@/auth";
import { getKakaoRedirectUri } from "@/lib/auth/kakao-oauth";

export async function signInWithKakaoCode(
  code: string,
  redirectUri?: string
): Promise<{ ok: true }> {
  const uri = redirectUri ?? getKakaoRedirectUri();
  if (!uri) {
    throw new Error("카카오 Redirect URI가 설정되지 않았습니다.");
  }

  try {
    const result = await signIn("kakao-code", {
      code,
      redirectUri: uri,
      redirect: false,
    });
    if (result?.error) {
      throw new Error("카카오 로그인에 실패했습니다.");
    }
  } catch (err) {
    if (err instanceof AuthError) {
      throw new Error(err.message || "카카오 로그인에 실패했습니다.");
    }
    throw err;
  }

  return { ok: true };
}
