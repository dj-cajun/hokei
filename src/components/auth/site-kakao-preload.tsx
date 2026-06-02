"use client";

import { useEffect } from "react";
import { ensureKakaoSdk, getKakaoJsKey } from "@/lib/auth/kakao-auth";

/** 카카오 JS SDK 선로드 — 로그인 모달 버튼이 바로 동작하도록 */
export function SiteKakaoPreload() {
  useEffect(() => {
    if (!getKakaoJsKey()) return;
    void ensureKakaoSdk();
  }, []);

  return null;
}
