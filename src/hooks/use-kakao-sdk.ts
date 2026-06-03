"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import {
  ensureKakaoSdk,
  getKakaoJsKey,
  kakaoAuthorize,
  startKakaoLoginViaServer,
} from "@/lib/auth/kakao-auth";
import { shouldPreferKakaoTalk } from "@/lib/auth/kakao-device";
import { encodeKakaoOAuthState } from "@/lib/auth/kakao-state";
import { safeCallbackPath } from "@/lib/auth/safe-callback-url";

function subscribeNoop() {
  return () => {};
}

function getPreferKakaoTalkSnapshot(loadSdk: boolean): boolean {
  return loadSdk && shouldPreferKakaoTalk();
}

export function useKakaoSdk(loadSdk = true) {
  const [sdkReady, setSdkReady] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const configured = Boolean(getKakaoJsKey());
  const useKakaoTalkSdk = useSyncExternalStore(
    subscribeNoop,
    () => getPreferKakaoTalkSnapshot(loadSdk),
    () => false
  );

  useEffect(() => {
    if (!configured || !loadSdk || !useKakaoTalkSdk) {
      return;
    }

    let cancelled = false;

    ensureKakaoSdk()
      .then((ok) => {
        if (cancelled) return;
        setSdkReady(ok);
        if (!ok) {
          setError(
            "카카오 SDK를 불러오지 못했습니다. 새로고침하거나, 브라우저 확장(광고 차단)을 잠시 끄고 다시 시도해 주세요."
          );
        } else {
          setError(null);
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
  }, [configured, loadSdk, useKakaoTalkSdk]);

  const ready =
    configured && loadSdk && (!useKakaoTalkSdk || sdkReady);

  const login = useCallback(async (callbackUrl?: string) => {
    setError(null);
    setPending(true);
    try {
      const path = safeCallbackPath(callbackUrl);

      if (!useKakaoTalkSdk) {
        startKakaoLoginViaServer(path);
        return;
      }

      const ok = await ensureKakaoSdk();
      if (!ok) {
        throw new Error("카카오 SDK가 준비되지 않았습니다.");
      }
      setSdkReady(true);
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
  }, [useKakaoTalkSdk]);

  return { ready, pending, error, configured, login };
}
