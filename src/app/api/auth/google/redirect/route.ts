import { NextResponse } from "next/server";
import { enforcePreset } from "@/lib/api/enforce-rate-limit";
import { readGoogleCallbackFromCookie } from "@/lib/auth/google-callback-cookie";
import { googleLoginErrorCodeFromUnknown } from "@/lib/auth/google-login-error-code";
import { findOrCreateUserFromGoogle } from "@/lib/auth/google-user";
import { verifyGoogleRedirectCsrf } from "@/lib/auth/google-redirect-csrf";
import { signInWithGoogleCredential } from "@/lib/auth/google-sign-in";
import { verifyGoogleIdToken } from "@/lib/auth/verify-google-token";

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
    const profile = await verifyGoogleIdToken(credential);
    if (!profile) {
      return NextResponse.redirect(
        new URL("/?login_error=google_token_invalid", request.url)
      );
    }

    const user = await findOrCreateUserFromGoogle(profile);
    if (!user) {
      return NextResponse.redirect(
        new URL("/?login_error=google_account_suspended", request.url)
      );
    }

    const signInResult = await signInWithGoogleCredential(credential, {
      redirect: false,
    });
    if (!signInResult) {
      return NextResponse.redirect(
        new URL("/?login_error=google_session_failed", request.url)
      );
    }

    return NextResponse.redirect(new URL(callbackUrl, request.url));
  } catch (err) {
    const code = googleLoginErrorCodeFromUnknown(err);
    const detail = err instanceof Error ? err.message : String(err);
    console.error("[google redirect]", code, detail, err);
    return NextResponse.redirect(
      new URL(`/?login_error=${code}`, request.url)
    );
  }
}
