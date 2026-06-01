"use client";

import { Loader2 } from "lucide-react";
import { KakaoSymbol } from "@/components/auth/kakao-symbol";
import { useKakaoSdk } from "@/hooks/use-kakao-sdk";
import { cn } from "@/lib/utils";

type KakaoLoginButtonProps = {
  /** login: 로그인 페이지 / start: 가입·시작하기 */
  variant?: "login" | "start";
  className?: string;
  disabled?: boolean;
};

/**
 * 카카오 공식 가이드 — 가로형 로그인 버튼
 * 배경 #FEE500, 텍스트 rgba(0,0,0,0.85), 심볼 포함
 */
export function KakaoLoginButton({
  variant = "login",
  className,
  disabled,
}: KakaoLoginButtonProps) {
  const { ready, error, configured, login } = useKakaoSdk();

  const label =
    variant === "start" ? "카카오 1초 시작하기" : "카카오 1초 로그인";

  if (!configured) {
    return (
      <p className="rounded-lg bg-secondary px-3 py-2 text-center text-xs text-muted-foreground">
        카카오 로그인: NEXT_PUBLIC_KAKAO_JS_KEY 설정 필요
      </p>
    );
  }

  return (
    <div className={className}>
      <button
        type="button"
        disabled={disabled || !ready}
        onClick={() => login()}
        className={cn(
          "flex h-12 w-full items-center justify-center gap-2 rounded-xl px-4 text-[15px] font-semibold transition-opacity",
          "bg-[#FEE500] text-[rgba(0,0,0,0.85)] hover:opacity-90 active:opacity-80",
          "disabled:cursor-not-allowed disabled:opacity-50"
        )}
        aria-label={label}
      >
        {!ready ? (
          <Loader2 className="h-5 w-5 animate-spin opacity-70" />
        ) : (
          <KakaoSymbol className="shrink-0 text-[rgba(0,0,0,0.85)]" />
        )}
        <span>{label}</span>
      </button>
      {error && (
        <p className="mt-1.5 text-center text-xs text-destructive">{error}</p>
      )}
    </div>
  );
}
