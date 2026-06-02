"use client";

import { useSession } from "next-auth/react";
import { useGoogleOneTap } from "@/hooks/use-google-one-tap";
import { getGoogleClientId } from "@/lib/auth/google-one-tap";
import { shouldEnableGoogleOneTap } from "@/lib/auth/secure-auth-context";

type GoogleOneTapProps = {
  /** false면 원탭 미표시 (로그인 페이지 등) */
  enabled?: boolean;
};

/**
 * Google Identity Services — One Tap
 *
 * g_id_onload 방식: Client ID·callback을 data-* 로 선언하고
 * GIS가 로드되면 handleCredentialResponse를 호출합니다.
 * (React에서는 동일 콜백을 useGoogleOneTap / initGoogleOneTap에서 연결)
 */
export function GoogleOneTap({ enabled = true }: GoogleOneTapProps) {
  const { status } = useSession();
  const isGuest = status === "unauthenticated";
  const oneTapActive =
    enabled && isGuest && shouldEnableGoogleOneTap();
  const { error, configured } = useGoogleOneTap(oneTapActive);

  const clientId = getGoogleClientId();

  if (!configured || !clientId || !oneTapActive) {
    return null;
  }

  /*
   * g_id_onload HTML 예시 (정적 페이지용):
   *
   * <div id="g_id_onload"
   *   data-client_id="YOUR_CLIENT_ID"
   *   data-context="signin"
   *   data-auto_select="true"
   *   data-cancel_on_tap_outside="false"
   *   data-callback="handleCredentialResponse">
   * </div>
   * <script src="https://accounts.google.com/gsi/client" async defer></script>
   *
   * React에서는 아래 useGoogleOneTap → initGoogleOneTap()으로 동일 설정.
   */
  return error ? (
    <p className="sr-only" role="status">
      {error}
    </p>
  ) : null;
}
