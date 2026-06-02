"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ensureKakaoSdk,
  getKakaoJsKey,
  kakaoAuthorize,
} from "@/lib/auth/kakao-auth";
import { encodeKakaoOAuthState } from "@/lib/auth/kakao-state";
import { safeCallbackPath } from "@/lib/auth/safe-callback-url";

export function useKakaoSdk() {
  const [ready, setReady] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const configured = Boolean(getKakaoJsKey());

  useEffect(() => {
    if (!configured) return;

    let cancelled = false;

    ensureKakaoSdk()
      .then((ok) => {
        if (cancelled) return;
        setReady(ok);
        if (!ok) {
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

  const login = useCallback(async (callbackUrl?: string) => {
    setError(null);
    setPending(true);
    try {
      const ok = await ensureKakaoSdk();
      if (!ok) {
        throw new Error("카카오 SDK가 준비되지 않았습니다.");
      }
      setReady(true);
      const path = safeCallbackPath(callbackUrl);
      kakaoAuthorize({
        state: encodeKakaoOAuthState(path),
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "카카오 로그인 실패";
      setError(message);
      throw err;
    } finally {
      setPending(false);
    }
  }, []);

  return { ready, pending, error, configured, login };
}
