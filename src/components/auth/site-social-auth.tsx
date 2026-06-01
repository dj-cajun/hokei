"use client";

import { usePathname } from "next/navigation";
import { GoogleOneTap } from "@/components/auth/google-one-tap";

const AUTH_PATHS = ["/login", "/signup"];

/**
 * 비로그인 사용자에게 사이트 전역 Google One Tap 노출
 * (로그인/회원가입 폼 페이지는 중복 방지를 위해 제외)
 */
export function SiteSocialAuth() {
  const pathname = usePathname();
  const onAuthPage = AUTH_PATHS.some((p) => pathname.startsWith(p));

  return <GoogleOneTap enabled={!onAuthPage} />;
}
