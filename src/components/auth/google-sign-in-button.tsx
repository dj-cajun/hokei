"use client";

import { useCallback, useEffect, useRef } from "react";
import { postGoogleCredential } from "@/lib/auth/google-credential-client";
import {
  getGoogleClientId,
  renderGoogleSignInButton,
} from "@/lib/auth/google-one-tap";
import { parseApiError } from "@/lib/api-response";
import { setGoogleCallbackCookie } from "@/lib/auth/google-callback-cookie";

type GoogleSignInButtonProps = {
  onSuccess?: () => void;
  onError?: (message: string) => void;
  className?: string;
  callbackUrl?: string;
};

export function GoogleSignInButton({
  onSuccess,
  onError,
  className,
  callbackUrl = "/",
}: GoogleSignInButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const configured = Boolean(getGoogleClientId());

  const handleCredential = useCallback(
    async (response: { credential?: string }) => {
      if (!response.credential) return;
      try {
        await postGoogleCredential(response.credential);
        onSuccess?.();
      } catch (err) {
        const msg =
          err instanceof Error
            ? err.message
            : parseApiError(err) ?? "구글 로그인에 실패했습니다.";
        onError?.(msg);
      }
    },
    [onSuccess, onError]
  );

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !configured) return;

    setGoogleCallbackCookie(callbackUrl);

    let cancelled = false;
    const timer = window.setTimeout(() => {
      renderGoogleSignInButton(el, handleCredential, { callbackUrl }).catch(
        () => {
          if (!cancelled) el.replaceChildren();
        }
      );
    }, 120);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      el.replaceChildren();
    };
  }, [configured, handleCredential, callbackUrl]);

  if (!configured) {
    return (
      <p className="rounded-lg bg-secondary px-3 py-2 text-center text-xs text-muted-foreground">
        구글 로그인: NEXT_PUBLIC_GOOGLE_CLIENT_ID 설정 필요
      </p>
    );
  }

  return (
    <div
      ref={containerRef}
      className={className ?? "flex min-h-[44px] w-full justify-center [&>div]:!w-full"}
    />
  );
}
