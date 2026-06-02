"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuthSessionSync } from "@/hooks/use-auth-session-sync";
import { postGoogleCredential } from "@/lib/auth/google-credential-client";
import {
  cancelGoogleOneTap,
  getGoogleClientId,
  initGoogleOneTap,
} from "@/lib/auth/google-one-tap";
import type { GoogleCredentialResponse } from "@/types/social-auth";

export function useGoogleOneTap(enabled: boolean) {
  const [error, setError] = useState<string | null>(null);
  const configured = Boolean(getGoogleClientId());
  const startedRef = useRef(false);
  const { completeLogin } = useAuthSessionSync();

  const handleCredential = useCallback(
    async (response: GoogleCredentialResponse) => {
      if (!response.credential) return;
      try {
        await postGoogleCredential(response.credential);
        await completeLogin({ refreshServer: true });
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "구글 로그인에 실패했습니다."
        );
      }
    },
    [completeLogin]
  );

  useEffect(() => {
    if (!enabled || !configured) {
      startedRef.current = false;
      cancelGoogleOneTap();
      return;
    }

    if (startedRef.current) return;

    let cancelled = false;
    startedRef.current = true;

    const timer = window.setTimeout(() => {
      initGoogleOneTap(handleCredential)
        .then((ok) => {
          if (!cancelled && !ok) {
            setError("구글 원탭을 초기화하지 못했습니다.");
          }
        })
        .catch((err) => {
          if (!cancelled) {
            setError(
              err instanceof Error ? err.message : "구글 SDK 로드 실패"
            );
          }
        });
    }, 280);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      startedRef.current = false;
      cancelGoogleOneTap();
    };
  }, [enabled, configured, handleCredential]);

  return { error, configured };
}
