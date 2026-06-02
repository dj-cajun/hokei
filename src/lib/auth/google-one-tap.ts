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

const GIS_CONFIG_VERSION = 2;

let gisInitialized = false;
let gisConfigVersion = 0;
let gisLoginUri = "";

function ensureGisInitialized(
  onCredential: GoogleCredentialHandler,
  loginUri: string
): boolean {
  const clientId = getGoogleClientId();
  if (!clientId || !window.google?.accounts?.id) return false;

  const loginUriChanged = gisLoginUri && gisLoginUri !== loginUri;

  const needsReinit =
    !gisInitialized ||
    loginUriChanged ||
    gisConfigVersion !== GIS_CONFIG_VERSION;

  if (needsReinit) {
    cancelGoogleOneTap();
    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: (response) => {
        void onCredential(response);
      },
      login_uri: loginUri,
      auto_select: !isGoogleAutoSelectDisabled(),
      cancel_on_tap_outside: false,
      context: "signin",
      itp_support: false,
      use_fedcm_for_prompt: GOOGLE_FEDCM_FOR_PROMPT,
    });
    gisInitialized = true;
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
  if (!ensureGisInitialized(onCredential, loginUri)) return false;

  window.google.accounts.id.prompt((notification) => {
    if (notification.isNotDisplayed()) {
      console.debug(
        "[google-one-tap] not displayed:",
        notification.getNotDisplayedReason()
      );
    }
    if (notification.isSkippedMoment()) {
      console.debug(
        "[google-one-tap] skipped:",
        notification.getSkippedReason()
      );
    }
  });

  return true;
}

export function cancelGoogleOneTap(): void {
  window.google?.accounts?.id?.cancel();
}

/** 구글 로그인 버튼 — ux_mode: redirect (팝업 차단 회피) */
export async function renderGoogleSignInButton(
  container: HTMLElement,
  onCredential: GoogleCredentialHandler,
  options?: { callbackUrl?: string }
): Promise<boolean> {
  const clientId = getGoogleClientId();
  if (!clientId) return false;

  await loadGoogleIdentitySdk();
  if (!window.google?.accounts?.id) return false;

  const loginUri = getGoogleRedirectLoginUri();
  if (!ensureGisInitialized(onCredential, loginUri)) return false;

  container.replaceChildren();

  const wrapper = document.createElement("div");
  wrapper.className = "w-full";
  wrapper.dataset.callbackUrl = options?.callbackUrl ?? "/";

  window.google.accounts.id.renderButton(wrapper, {
    type: "standard",
    theme: "outline",
    size: "large",
    text: "continue_with",
    shape: "pill",
    logo_alignment: "left",
    width: Math.min(container.offsetWidth || 320, 400),
    locale: "ko",
    ux_mode: "redirect",
    login_uri: loginUri,
  });

  container.appendChild(wrapper);

  return true;
}

/** 로그아웃 시 — Disable Auto-select (GIS 권장) */
export function disableGoogleAutoSelectOnLogout(): void {
  markGoogleAutoSelectDisabled();
  cancelGoogleOneTap();
}

/** 구글 로그인 성공 후 */
export function onGoogleLoginSuccess(): void {
  clearGoogleAutoSelectDisabled();
  cancelGoogleOneTap();
}

export { isGoogleAutoSelectDisabled, markGoogleAutoSelectDisabled };
