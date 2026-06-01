import { loadExternalScript } from "@/lib/auth/load-external-script";
import type { KakaoAuthAuthorizeParams } from "@/types/social-auth";

const KAKAO_SDK_URL = "https://t1.kakaocdn.net/kakao_js_sdk/2.7.4/kakao.min.js";

export function getKakaoJsKey(): string | undefined {
  return process.env.NEXT_PUBLIC_KAKAO_JS_KEY?.trim() || undefined;
}

export function getKakaoRedirectUri(): string {
  if (typeof window !== "undefined") {
    return `${window.location.origin}/api/auth/kakao/callback`;
  }
  const site = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  return site ? `${site}/api/auth/kakao/callback` : "";
}

export async function loadKakaoSdk(): Promise<void> {
  await loadExternalScript(KAKAO_SDK_URL, "kakao-jssdk");
}

export function initKakaoSdk(): boolean {
  const key = getKakaoJsKey();
  if (!key || !window.Kakao) return false;
  if (!window.Kakao.isInitialized()) {
    window.Kakao.init(key);
  }
  return window.Kakao.isInitialized();
}

/**
 * 카카오 로그인 — 모바일에서 카카오톡 앱으로 authorize
 * throughTalk: true → 카카오톡 설치 시 앱에서 [동의하고 계속하기] 화면
 */
export function kakaoAuthorize(
  options?: Partial<KakaoAuthAuthorizeParams>
): void {
  if (!initKakaoSdk()) {
    throw new Error(
      "Kakao SDK가 준비되지 않았습니다. NEXT_PUBLIC_KAKAO_JS_KEY를 확인하세요."
    );
  }

  window.Kakao!.Auth.authorize({
    redirectUri: options?.redirectUri ?? getKakaoRedirectUri(),
    scope: options?.scope ?? "profile_nickname,account_email",
    throughTalk: options?.throughTalk ?? true,
    ...options,
  });
}
