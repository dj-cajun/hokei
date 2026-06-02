import { AuthError } from "next-auth";
import { signIn } from "@/auth";

type GoogleSignInOptions = {
  /** POST Route Handler에서 세션 쿠키 발급 후 브라우저 리다이렉트 */
  redirect?: boolean;
  redirectTo?: string;
};

export async function signInWithGoogleCredential(
  credential: string,
  options: GoogleSignInOptions = {}
): Promise<{ ok: true } | void> {
  if (!credential.trim()) {
    throw new Error("credential이 필요합니다.");
  }

  const redirect = options.redirect ?? false;
  const redirectTo = options.redirectTo ?? "/";

  try {
    if (redirect) {
      await signIn("google-id-token", {
        credential,
        redirectTo,
        redirect: true,
      });
      return;
    }

    const result = await signIn("google-id-token", {
      credential,
      redirect: false,
    });

    if (result?.error) {
      throw new Error("구글 로그인에 실패했습니다.");
    }
  } catch (err) {
    if (err instanceof AuthError) {
      throw new Error(err.message || "구글 로그인에 실패했습니다.");
    }
    throw err;
  }

  return { ok: true };
}
