import { AuthError } from "@auth/core/errors";
import { signIn } from "@/auth";

type GoogleSignInOptions = {
  /** POST Route Handler에서 세션 쿠키 발급 후 브라우저 리다이렉트 */
  redirect?: boolean;
  redirectTo?: string;
};

function isGoogleSignInFailureRedirect(result: unknown): boolean {
  return (
    typeof result === "string" &&
    (result.includes("error=") || result.includes("/signin"))
  );
}

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
    const result = await signIn("google-id-token", {
      credential,
      redirectTo,
      redirect,
    });

    if (redirect) {
      return;
    }

    if (isGoogleSignInFailureRedirect(result)) {
      throw new Error("구글 로그인에 실패했습니다.");
    }
  } catch (err) {
    if (!(err instanceof AuthError)) {
      throw err;
    }
    throw new Error("구글 로그인에 실패했습니다.");
  }

  return { ok: true };
}
