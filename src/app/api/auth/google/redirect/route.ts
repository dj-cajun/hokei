import { NextResponse } from "next/server";
import { enforcePreset } from "@/lib/api/enforce-rate-limit";
import { verifyGoogleRedirectCsrf } from "@/lib/auth/google-redirect-csrf";
import { signInWithGoogleCredential } from "@/lib/auth/google-sign-in";
import { readGoogleCallbackFromCookie } from "@/lib/auth/google-callback-cookie";

/**
 * GIS 버튼 redirect 모드 — Google이 credential을 form POST로 전달
 * (팝업 차단 회피)
 */
export async function POST(request: Request) {
  const limited = await enforcePreset(request, "login");
  if (limited) return limited;

  const form = await request.formData();
  const credential = form.get("credential")?.toString().trim();
  const csrf = form.get("g_csrf_token")?.toString();
  const callbackUrl = readGoogleCallbackFromCookie(
    request.headers.get("cookie")
  );

  if (!verifyGoogleRedirectCsrf(request.headers.get("cookie"), csrf)) {
    return NextResponse.redirect(
      new URL("/?login_error=google_csrf", request.url)
    );
  }

  if (!credential) {
    return NextResponse.redirect(
      new URL("/?login_error=google_no_credential", request.url)
    );
  }

  try {
    await signInWithGoogleCredential(credential, {
      redirect: true,
      redirectTo: callbackUrl,
    });
  } catch {
    return NextResponse.redirect(
      new URL("/?login_error=google_login_failed", request.url)
    );
  }
}
