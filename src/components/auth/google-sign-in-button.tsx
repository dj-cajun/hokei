"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  getGoogleClientId,
  preloadGoogleRedirectSdk,
  renderGoogleSignInButton,
  triggerGoogleRedirectClick,
} from "@/lib/auth/google-one-tap";
import { setGoogleCallbackCookie } from "@/lib/auth/google-callback-cookie";
import { isInsecureLocalDev } from "@/lib/auth/insecure-local-dev";
import { isLocalDevHost } from "@/lib/auth/local-dev-host";
import { cn } from "@/lib/utils";

type GoogleSignInButtonProps = {
  onSuccess?: () => void;
  onError?: (message: string) => void;
  className?: string;
  callbackUrl?: string;
};

/**
 * GIS redirect 버튼.
 * 로컬 http는 팝업·iframe 차단을 피하기 위해 네이티브 버튼 + 같은 제스처에서 redirect 트리거.
 */
export function GoogleSignInButton({
  onError,
  className,
  callbackUrl = "/",
}: GoogleSignInButtonProps) {
  const gisHostRef = useRef<HTMLDivElement>(null);
  const [gisReady, setGisReady] = useState(false);
  const [redirectPrimed, setRedirectPrimed] = useState(false);
  const [insecureLocal] = useState(() => isInsecureLocalDev());
  const [localDev] = useState(() => isLocalDevHost());
  const configured = Boolean(getGoogleClientId());

  const primeRedirect = useCallback(async () => {
    setGoogleCallbackCookie(callbackUrl);
    const ok = await preloadGoogleRedirectSdk();
    setRedirectPrimed(ok);
    return ok;
  }, [callbackUrl]);

  useEffect(() => {
    if (!configured) return;

    if (insecureLocal) {
      let cancelled = false;
      primeRedirect().then((ok) => {
        if (!cancelled && !ok) {
          onError?.(
            "구글 로그인을 준비하지 못했습니다. 새로고침 후 다시 시도해 주세요."
          );
        }
      });
      return () => {
        cancelled = true;
        setRedirectPrimed(false);
      };
    }

    const host = gisHostRef.current;
    if (!host) return;

    setGoogleCallbackCookie(callbackUrl);
    setGisReady(false);

    let cancelled = false;
    const timer = window.setTimeout(() => {
      renderGoogleSignInButton(host, { callbackUrl })
        .then((ok) => {
          if (cancelled) return;
          if (ok) setGisReady(true);
          else {
            host.replaceChildren();
            onError?.(
              "구글 로그인 버튼을 불러오지 못했습니다. 새로고침 후 다시 시도해 주세요."
            );
          }
        })
        .catch(() => {
          if (!cancelled) {
            host.replaceChildren();
            onError?.(
              "구글 로그인 버튼을 불러오지 못했습니다. 팝업 차단을 해제하거나 새로고침해 주세요."
            );
          }
        });
    }, 120);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      host.replaceChildren();
      setGisReady(false);
    };
  }, [configured, callbackUrl, onError, insecureLocal, primeRedirect]);

  const handleInsecureLocalClick = () => {
    if (!redirectPrimed) {
      onError?.("구글 로그인을 준비 중입니다. 잠시 후 다시 눌러 주세요.");
      return;
    }
    const started = triggerGoogleRedirectClick();
    if (!started) {
      onError?.(
        "구글 로그인을 시작하지 못했습니다. 새로고침 후 다시 시도해 주세요."
      );
    }
  };

  if (!configured) {
    return (
      <p className="rounded-lg bg-secondary px-3 py-2 text-center text-xs text-muted-foreground">
        구글 로그인: NEXT_PUBLIC_GOOGLE_CLIENT_ID 설정 필요
      </p>
    );
  }

  if (insecureLocal) {
    return (
      <div className={cn("w-full", className)}>
        <button
          type="button"
          onClick={handleInsecureLocalClick}
          disabled={!redirectPrimed}
          className={cn(
            "flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-[#e5e7eb] bg-white px-4 text-[15px] font-semibold text-foreground",
            "hover:bg-secondary/40 disabled:cursor-wait disabled:opacity-70"
          )}
        >
          <GoogleMark />
          <span>Google로 계속하기</span>
        </button>
        {localDev && (
          <p className="mt-1.5 text-center text-[11px] leading-snug text-muted-foreground">
            로컬 개발: Google Cloud Console → OAuth 클라이언트에{" "}
            <span className="font-mono">http://localhost:3001</span> (JavaScript
            원본) 및{" "}
            <span className="font-mono">
              http://localhost:3001/api/auth/google/redirect
            </span>{" "}
            (리다이렉트 URI) 등록
          </p>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative h-12 w-full",
        !gisReady && "opacity-70",
        className
      )}
    >
      <div
        className="pointer-events-none flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-[#e5e7eb] bg-white px-4 text-[15px] font-semibold text-foreground"
        aria-hidden
      >
        <GoogleMark />
        <span>Google로 계속하기</span>
      </div>
      <div
        ref={gisHostRef}
        className={cn(
          "absolute inset-0 z-10 overflow-hidden rounded-xl",
          "[&>div]:!h-full [&>div]:!w-full",
          "[&_iframe]:!h-12 [&_iframe]:!min-h-[44px] [&_iframe]:!w-full",
          gisReady ? "opacity-[0.02]" : "opacity-0"
        )}
        aria-label="Google로 계속하기"
      />
      {localDev && (
        <p className="mt-1.5 text-center text-[11px] leading-snug text-muted-foreground">
          로컬 개발: Google Cloud Console → OAuth 클라이언트 → 승인된 JavaScript
          원본에 <span className="font-mono">http://localhost:3001</span> 등록
        </p>
      )}
    </div>
  );
}

function GoogleMark() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}
