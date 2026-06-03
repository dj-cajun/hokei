import { loadExternalScript } from "@/lib/auth/load-external-script";
import { shouldPreferKakaoTalk } from "@/lib/auth/kakao-device";
import { isLocalDevHost } from "@/lib/auth/local-dev-host";
import { getKakaoRedirectUri } from "@/lib/auth/kakao-redirect-uri";
import type { KakaoAuthAuthorizeParams } from "@/types/social-auth";

const KAKAO_SDK_URL = "https://t1.kakaocdn.net/kakao_js_sdk/2.7.4/kakao.min.js";

let sdkReadyPromise: Promise<boolean> | null = null;

export function getKakaoJsKey(): string | undefined {
  return process.env.NEXT_PUBLIC_KAKAO_JS_KEY?.trim() || undefined;
}

export async function loadKakaoSdk(): Promise<void> {
  await loadExternalScript(KAKAO_SDK_URL, "kakao-jssdk");
}

/** 사이트 진입 시 SDK 선로드 — 「카카오 1초 로그인」 즉시 클릭 가능 */
export function ensureKakaoSdk(): Promise<boolean> {
  if (!getKakaoJsKey()) return Promise.resolve(false);
  if (!sdkReadyPromise) {
    sdkReadyPromise = loadKakaoSdk()
      .then(() => initKakaoSdk())
      .catch((err) => {
        console.warn("[kakao-auth] SDK load/init failed:", err);
        sdkReadyPromise = null;
        return false;
      });
  }
  return sdkReadyPromise;
}

export function initKakaoSdk(): boolean {
  const key = getKakaoJsKey();
  if (!key || !window.Kakao) return false;
  if (!window.Kakao.isInitialized()) {
    window.Kakao.init(key);
  }
  return window.Kakao.isInitialized();
}

/** PC·일반 브라우저 — REST API 키로 서버 redirect (Redirect URI는 REST 키에 등록) */

/**
 * 카카오톡 앱 로그인 — JS SDK authorize, throughTalk (Redirect URI·웹 도메인은 JavaScript 키)
 */
export function startKakaoLoginViaServer(callbackPath: string = "/"): void {
  const params = new URLSearchParams();
  if (callbackPath && callbackPath !== "/") {
    params.set("callbackUrl", callbackPath);
  }
  const qs = params.toString();
  window.location.assign(`/api/auth/kakao/start${qs ? `?${qs}` : ""}`);
}

export function kakaoAuthorize(
  options?: Partial<KakaoAuthAuthorizeParams>
): void {
  if (!initKakaoSdk()) {
    throw new Error(
      "Kakao SDK가 준비되지 않았습니다. NEXT_PUBLIC_KAKAO_JS_KEY를 확인하세요."
    );
  }

  const throughTalk =
    options?.throughTalk ??
    (!isLocalDevHost() && shouldPreferKakaoTalk());

  const params: KakaoAuthAuthorizeParams = {
    redirectUri: options?.redirectUri ?? getKakaoRedirectUri(),
    scope: options?.scope ?? "profile_nickname,account_email",
    throughTalk,
  };

  const state = options?.state;
  if (typeof state === "string" && state.length > 0) {
    params.state = state;
  }

  if (options?.scope) params.scope = options.scope;
  if (options?.redirectUri) params.redirectUri = options.redirectUri;
  if (options?.throughTalk !== undefined) params.throughTalk = options.throughTalk;
  if (options?.prompts) params.prompts = options.prompts;

  window.Kakao!.Auth.authorize(params);
}
