/**
 * HTML/바닐라 JS 환경용 Google 로그인 모듈 (참고 구현)
 *
 * <script type="module">
 *   import { initGoogleOneTap } from '/auth/social-auth.vanilla.js';
 *   initGoogleOneTap({ clientId: '...', onCredential: (res) => console.log(res) });
 * </script>
 */

const GOOGLE_DISABLE_KEY = "hokei_google_disable_auto_select";

export function isGoogleAutoSelectDisabled() {
  return localStorage.getItem(GOOGLE_DISABLE_KEY) === "1";
}

export function markGoogleAutoSelectDisabled() {
  localStorage.setItem(GOOGLE_DISABLE_KEY, "1");
  window.google?.accounts?.id?.disableAutoSelect();
}

export function clearGoogleAutoSelectDisabled() {
  localStorage.removeItem(GOOGLE_DISABLE_KEY);
}

function loadScript(src, id) {
  return new Promise((resolve, reject) => {
    if (id && document.getElementById(id)) {
      resolve();
      return;
    }
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.defer = true;
    if (id) s.id = id;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`Script load failed: ${src}`));
    document.head.appendChild(s);
  });
}

/**
 * Google One Tap — handleCredentialResponse + Disable Auto-select
 */
export async function initGoogleOneTap({ clientId, onCredential }) {
  await loadScript(
    "https://accounts.google.com/gsi/client",
    "google-gsi-client"
  );

  window.handleCredentialResponse = (response) => {
    clearGoogleAutoSelectDisabled();
    onCredential?.(response);
  };

  window.google.accounts.id.initialize({
    client_id: clientId,
    callback: window.handleCredentialResponse,
    auto_select: !isGoogleAutoSelectDisabled(),
    cancel_on_tap_outside: false,
    context: "signin",
    itp_support: true,
  });

  window.google.accounts.id.prompt();
}

/** 로그아웃 버튼에서 호출 — 무한 원탭 방지 */
export function onUserSignOut() {
  markGoogleAutoSelectDisabled();
  window.google?.accounts?.id?.cancel();
}
