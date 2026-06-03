"use client";

import { useEffect } from "react";
import { ensureKakaoSdk, getKakaoJsKey } from "@/lib/auth/kakao-auth";
import { shouldPreferKakaoTalk } from "@/lib/auth/kakao-device";
import { isKakaoLoginEnabled } from "@/lib/auth/kakao-feature";
import { isLocalDevHost } from "@/lib/auth/local-dev-host";

/** 카카오톡 앱 로그인(throughTalk) 시에만 SDK 선로드 */
export function SiteKakaoPreload() {
  useEffect(() => {
    if (!isKakaoLoginEnabled() || !getKakaoJsKey()) return;
    if (isLocalDevHost() || !shouldPreferKakaoTalk()) return;
    void ensureKakaoSdk();
  }, []);

  return null;
}
