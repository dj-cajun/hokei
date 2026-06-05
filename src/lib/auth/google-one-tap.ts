import { loadExternalScript } from "@/lib/auth/load-external-script";
import { getGoogleRedirectLoginUri } from "@/lib/auth/google-redirect-uri";
import { GOOGLE_FEDCM_FOR_PROMPT } from "@/lib/auth/secure-auth-context";
import {
  clearGoogleAutoSelectDisabled,
  isGoogleAutoSelectDisabled,
  markGoogleAutoSelectDisabled,
} from "@/lib/auth/social-storage";
import type { GoogleCredentialResponse } from "@/types/social-auth";

const GIS_SDK_URL = "https://accounts.google.com/gsi/client";

export function getGoogleClientId(): string | undefined {
  return process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim() || undefined;
}

export async function loadGoogleIdentitySdk(): Promise<void> {
  await loadExternalScript(GIS_SDK_URL, "google-gsi-client");
}

export type GoogleCredentialHandler = (
  response: GoogleCredentialResponse
) => void | Promise<void>;

const GIS_CONFIG_VERSION = 3;

type GisMode = "redirect" | "prompt";

let gisMode: GisMode | null = null;
let gisConfigVersion = 0;
let gisLoginUri = "";
let activeCredentialHandler: GoogleCredentialHandler | null = null;
let redirectSdkPrimed = false;

function resetGisState(): void {
  cancelGoogleOneTap();
  gisMode = null;
  gisConfigVersion = 0;
  redirectSdkPrimed = false;
}

function clearGoogleCredentialCallback(): void {
  delete window.handleCredentialResponse;
}

/** redirect 버튼 렌더 전 — prompt·callback 잔여 상태 제거 (callback 있으면 popup 강제) */
export function prepareGoogleRedirectSignIn(): void {
  if (gisMode === "redirect") {
    cancelGoogleOneTap();
    clearGoogleCredentialCallback();
    window.google?.accounts?.id?.disableAutoSelect();
    return;
  }
  resetGisState();
  cancelGoogleOneTap();
  clearGoogleCredentialCallback();
  window.google?.accounts?.id?.disableAutoSelect();
}

/** redirect 버튼 — callback 없이 login_uri만 (팝업 id_token 경로 방지) */
function ensureGisRedirectInitialized(loginUri: string): boolean {
  const clientId = getGoogleClientId();
  if (!clientId || !window.google?.accounts?.id) return false;

  const loginUriChanged = gisLoginUri && gisLoginUri !== loginUri;
  const needsReinit =
    gisMode !== "redirect" ||
    loginUriChanged ||
    gisConfigVersion !== GIS_CONFIG_VERSION;

  if (needsReinit) {
    if (gisMode === "prompt") resetGisState();
    cancelGoogleOneTap();
    clearGoogleCredentialCallback();
    window.google.accounts.id.initialize({
      client_id: clientId,
      login_uri: loginUri,
      ux_mode: "redirect",
      auto_select: false,
      cancel_on_tap_outside: true,
      context: "signin",
      itp_support: false,
    });
    gisMode = "redirect";
    gisConfigVersion = GIS_CONFIG_VERSION;
    gisLoginUri = loginUri;
  }

  if (gisMode === "redirect") redirectSdkPrimed = true;
  return true;
}

/** One Tap / credential 콜백 — popup·FedCM 경로 */
function ensureGisPromptInitialized(
  onCredential: GoogleCredentialHandler,
  loginUri: string
): boolean {
  const clientId = getGoogleClientId();
  if (!clientId || !window.google?.accounts?.id) return false;

  const loginUriChanged = gisLoginUri && gisLoginUri !== loginUri;
  const needsReinit =
    gisMode !== "prompt" ||
    loginUriChanged ||
    gisConfigVersion !== GIS_CONFIG_VERSION;

  activeCredentialHandler = onCredential;

  if (needsReinit) {
    if (gisMode === "redirect") resetGisState();
    cancelGoogleOneTap();
    clearGoogleCredentialCallback();
    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: (response) => {
        void activeCredentialHandler?.(response);
      },
      login_uri: loginUri,
      auto_select: !isGoogleAutoSelectDisabled(),
      cancel_on_tap_outside: false,
      context: "signin",
      itp_support: false,
      use_fedcm_for_prompt: GOOGLE_FEDCM_FOR_PROMPT,
    });
    gisMode = "prompt";
    gisConfigVersion = GIS_CONFIG_VERSION;
    gisLoginUri = loginUri;
  }

  return true;
}

/**
 * GIS initialize + prompt
 * - auto_select: 로그아웃 후 disable 플래그가 있으면 false (무한 원탭 방지)
 */
export async function initGoogleOneTap(
  onCredential: GoogleCredentialHandler
): Promise<boolean> {
  const clientId = getGoogleClientId();
  if (!clientId) return false;

  await loadGoogleIdentitySdk();

  if (!window.google?.accounts?.id) {
    console.warn("[google-one-tap] GIS accounts.id unavailable");
    return false;
  }

  window.handleCredentialResponse = (response) => {
    void onCredential(response);
  };

  const loginUri = getGoogleRedirectLoginUri();
  if (!ensureGisPromptInitialized(onCredential, loginUri)) return false;

  // moment 리스너(isNotDisplayed/isSkippedMoment)는 FedCM 필수화 경고 유발 — 생략
  window.google.accounts.id.prompt();

  return true;
}

export function cancelGoogleOneTap(): void {
  window.google?.accounts?.id?.cancel();
}

/**
 * 구글 로그인 버튼 — ux_mode: redirect (같은 탭 POST, 팝업 미사용)
 * credential은 /api/auth/google/redirect 로 전달됩니다.
 */
export async function renderGoogleSignInButton(
  container: HTMLElement,
  options?: { callbackUrl?: string }
): Promise<boolean> {
  const clientId = getGoogleClientId();
  if (!clientId) return false;

  prepareGoogleRedirectSignIn();

  await loadGoogleIdentitySdk();
  if (!window.google?.accounts?.id) return false;

  const loginUri = getGoogleRedirectLoginUri();
  if (!loginUri) return false;
  if (!ensureGisRedirectInitialized(loginUri)) return false;

  container.replaceChildren();

  const wrapper = document.createElement("div");
  wrapper.className = "h-full w-full min-h-[44px]";
  wrapper.dataset.callbackUrl = options?.callbackUrl ?? "/";

  const width = Math.min(container.offsetWidth || 320, 400);

  window.google.accounts.id.renderButton(wrapper, {
    type: "standard",
    theme: "outline",
    size: "large",
    text: "continue_with",
    shape: "pill",
    logo_alignment: "left",
    width,
    locale: "ko",
    ux_mode: "redirect",
    login_uri: loginUri,
  });

  container.appendChild(wrapper);

  return true;
}

/** 로컬 http — SDK·redirect 초기화만 미리 수행 (클릭 시 동기 redirect 트리거용) */
export async function preloadGoogleRedirectSdk(): Promise<boolean> {
  const clientId = getGoogleClientId();
  if (!clientId) return false;

  prepareGoogleRedirectSignIn();
  await loadGoogleIdentitySdk();
  if (!window.google?.accounts?.id) return false;

  const loginUri = getGoogleRedirectLoginUri();
  if (!loginUri) return false;

  return ensureGisRedirectInitialized(loginUri);
}

/**
 * redirect GIS 버튼을 한 번 렌더한 뒤 즉시 클릭 (같은 사용자 제스처 스택 유지)
 * initialize에 callback이 남아 있으면 popup으로 떨어지므로 prepareGoogleRedirectSignIn 필수.
 */
export function triggerGoogleRedirectClick(): boolean {
  if (!redirectSdkPrimed || !window.google?.accounts?.id) return false;

  const loginUri = getGoogleRedirectLoginUri();
  if (!loginUri) return false;

  const host = document.createElement("div");
  host.setAttribute("aria-hidden", "true");
  host.style.cssText =
    "position:fixed;left:-9999px;top:0;width:320px;height:48px;opacity:0;pointer-events:none;";
  document.body.appendChild(host);

  try {
    window.google.accounts.id.renderButton(host, {
      type: "standard",
      theme: "outline",
      size: "large",
      text: "continue_with",
      shape: "pill",
      width: 320,
      locale: "ko",
      ux_mode: "redirect",
      login_uri: loginUri,
    });

    const clickable = host.querySelector('[role="button"]') as HTMLElement | null;
    if (!clickable) return false;
    clickable.click();
    return true;
  } finally {
    window.setTimeout(() => host.remove(), 10_000);
  }
}

/** 로그아웃 시 — Disable Auto-select (GIS 권장) */
export function disableGoogleAutoSelectOnLogout(): void {
  markGoogleAutoSelectDisabled();
  cancelGoogleOneTap();
  resetGisState();
}

/** 구글 로그인 성공 후 */
export function onGoogleLoginSuccess(): void {
  clearGoogleAutoSelectDisabled();
  cancelGoogleOneTap();
}

export { isGoogleAutoSelectDisabled, markGoogleAutoSelectDisabled };
