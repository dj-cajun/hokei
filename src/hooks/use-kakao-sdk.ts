"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getKakaoJsKey,
  initKakaoSdk,
  kakaoAuthorize,
  loadKakaoSdk,
} from "@/lib/auth/kakao-auth";

export function useKakaoSdk() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const configured = Boolean(getKakaoJsKey());

  useEffect(() => {
    if (!configured) return;

    let cancelled = false;

    loadKakaoSdk()
      .then(() => {
        if (cancelled) return;
        if (initKakaoSdk()) {
          setReady(true);
        } else {
          setError("카카오 SDK 초기화에 실패했습니다.");
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "카카오 SDK 로드 실패"
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, [configured]);

  const login = useCallback(() => {
    try {
      kakaoAuthorize({ throughTalk: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "카카오 로그인 실패");
    }
  }, []);

  return { ready, error, configured, login };
}
