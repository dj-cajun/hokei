"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { KakaoSymbol } from "@/components/auth/kakao-symbol";
import { useKakaoSdk } from "@/hooks/use-kakao-sdk";
import { cn } from "@/lib/utils";

type KakaoLoginButtonProps = {
  /** login: 로그인 페이지 / start: 가입·시작하기 */
  variant?: "login" | "start";
  className?: string;
  disabled?: boolean;
  /** 로그인 성공 후 이동 경로 (카카오 state) */
  callbackUrl?: string;
};

/**
 * 카카오 공식 가이드 — 가로형 로그인 버튼
 * 모바일: 카카오톡 앱(throughTalk) / PC·인앱: 카카오계정 웹
 */
export function KakaoLoginButton({
  variant = "login",
  className,
  disabled,
  callbackUrl,
}: KakaoLoginButtonProps) {
  const { ready, pending, error, configured, login } = useKakaoSdk();
  const [clickError, setClickError] = useState<string | null>(null);

  const label =
    variant === "start" ? "카카오 1초 시작하기" : "카카오 1초 로그인";

  if (!configured) {
    return (
      <p className="rounded-lg bg-secondary px-3 py-2 text-center text-xs text-muted-foreground">
        카카오 로그인: NEXT_PUBLIC_KAKAO_JS_KEY 설정 필요
      </p>
    );
  }

  const busy = pending || !ready;

  return (
    <div className={className}>
      <button
        type="button"
        disabled={disabled || pending}
        onClick={() => {
          setClickError(null);
          void login(callbackUrl).catch((err) => {
            setClickError(
              err instanceof Error ? err.message : "카카오 로그인 실패"
            );
          });
        }}
        className={cn(
          "flex h-12 w-full items-center justify-center gap-2 rounded-xl px-4 text-[15px] font-semibold transition-opacity",
          "bg-[#FEE500] text-[rgba(0,0,0,0.85)] hover:opacity-90 active:opacity-80",
          "disabled:cursor-not-allowed disabled:opacity-50"
        )}
        aria-label={label}
        aria-busy={busy}
      >
        {busy ? (
          <Loader2 className="h-5 w-5 animate-spin opacity-70" />
        ) : (
          <KakaoSymbol className="shrink-0 text-[rgba(0,0,0,0.85)]" />
        )}
        <span>{busy && !ready ? "카카오 연결 중…" : label}</span>
      </button>
      {(clickError || error) && (
        <p className="mt-1.5 text-center text-xs text-destructive">
          {clickError ?? error}
        </p>
      )}
    </div>
  );
}
