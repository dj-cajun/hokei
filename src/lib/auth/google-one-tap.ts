import { loadExternalScript } from "@/lib/auth/load-external-script";
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

let gisInitialized = false;

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

  const autoSelect = !isGoogleAutoSelectDisabled();

  if (!gisInitialized) {
    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: (response) => {
        void onCredential(response);
      },
      auto_select: autoSelect,
      cancel_on_tap_outside: false,
      context: "signin",
      itp_support: true,
      use_fedcm_for_prompt: true,
    });
    gisInitialized = true;
  }

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

/** 모달 내 구글 로그인 버튼 렌더 */
export async function renderGoogleSignInButton(
  container: HTMLElement,
  onCredential: GoogleCredentialHandler
): Promise<boolean> {
  const clientId = getGoogleClientId();
  if (!clientId) return false;

  await loadGoogleIdentitySdk();
  if (!window.google?.accounts?.id) return false;

  if (!gisInitialized) {
    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: (response) => {
        void onCredential(response);
      },
      auto_select: !isGoogleAutoSelectDisabled(),
      cancel_on_tap_outside: false,
      context: "signin",
      itp_support: true,
    });
    gisInitialized = true;
  }

  container.replaceChildren();
  window.google.accounts.id.renderButton(container, {
    type: "standard",
    theme: "outline",
    size: "large",
    text: "continue_with",
    shape: "pill",
    logo_alignment: "left",
    width: Math.min(container.offsetWidth || 320, 400),
    locale: "ko",
  });

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
