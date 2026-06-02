"use client";

import { useEffect, useRef } from "react";
import {
  getGoogleClientId,
  renderGoogleSignInButton,
} from "@/lib/auth/google-one-tap";
import { setGoogleCallbackCookie } from "@/lib/auth/google-callback-cookie";

type GoogleSignInButtonProps = {
  onSuccess?: () => void;
  onError?: (message: string) => void;
  className?: string;
  callbackUrl?: string;
};

export function GoogleSignInButton({
  onError,
  className,
  callbackUrl = "/",
}: GoogleSignInButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const configured = Boolean(getGoogleClientId());

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !configured) return;

    setGoogleCallbackCookie(callbackUrl);

    let cancelled = false;
    const timer = window.setTimeout(() => {
      renderGoogleSignInButton(el, { callbackUrl }).catch(() => {
        if (!cancelled) {
          el.replaceChildren();
          onError?.(
            "구글 로그인 버튼을 불러오지 못했습니다. 팝업 차단을 해제하거나 새로고침해 주세요."
          );
        }
      });
    }, 120);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      el.replaceChildren();
    };
  }, [configured, callbackUrl, onError]);

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
