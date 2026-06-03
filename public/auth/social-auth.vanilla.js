/**
 * HTML/바닐라 JS 환경용 소셜 로그인 모듈 (참고 구현)
 *
 * <script type="module">
 *   import { initKakaoLogin, initGoogleOneTap } from '/auth/social-auth.vanilla.js';
 *   initKakaoLogin({ jsKey: '...', buttonId: 'kakao-login-btn' });
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
 * 카카ao.Auth.authorize — 모바일 카카오톡 앱 연동
 */
export async function initKakaoLogin({ jsKey, buttonId, redirectUri }) {
  await loadScript(
    "https://t1.kakaocdn.net/kakao_js_sdk/2.7.4/kakao.min.js",
    "kakao-jssdk"
  );
  if (!window.Kakao.isInitialized()) window.Kakao.init(jsKey);

  const uri =
    redirectUri ?? `${window.location.origin}/api/auth/kakao/callback`;

  const local =
    location.hostname === "localhost" || location.hostname === "127.0.0.1";

  document.getElementById(buttonId)?.addEventListener("click", () => {
    if (local) {
      const q = new URLSearchParams();
      window.location.assign(`/api/auth/kakao/start${q.toString() ? `?${q}` : ""}`);
      return;
    }
    window.Kakao.Auth.authorize({
      redirectUri: uri,
      scope: "profile_nickname,account_email",
      throughTalk: true,
    });
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
