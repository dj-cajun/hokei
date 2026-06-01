import { AuthError } from "next-auth";
import { signIn } from "@/auth";

export async function signInWithGoogleCredential(
  credential: string
): Promise<{ ok: true }> {
  if (!credential.trim()) {
    throw new Error("credential이 필요합니다.");
  }

  try {
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
