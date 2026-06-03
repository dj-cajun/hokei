"use client";

import { usePathname } from "next/navigation";
import { GoogleOneTap } from "@/components/auth/google-one-tap";
import { shouldEnableGoogleOneTap } from "@/lib/auth/secure-auth-context";

const AUTH_PATHS = ["/login", "/signup"];

/**
 * 비로그인 사용자에게 사이트 전역 Google One Tap 노출 (HTTPS만)
 * localhost HTTP에서는 GIS prompt가 팝업 오류를 내므로 비활성
 */
export function SiteSocialAuth() {
  const pathname = usePathname();
  const onAuthPage = AUTH_PATHS.some((p) => pathname.startsWith(p));

  if (!shouldEnableGoogleOneTap()) {
    return null;
  }

  return <GoogleOneTap enabled={!onAuthPage} />;
}
