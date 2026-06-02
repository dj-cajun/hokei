"use client";

import Link from "next/link";
import { useAuthSessionSync } from "@/hooks/use-auth-session-sync";
import { KakaoLoginButton } from "@/components/auth/kakao-login-button";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { SocialLoginDivider } from "@/components/auth/social-login-divider";
import { useToast } from "@/components/providers/toast-provider";

type SocialLoginSectionProps = {
  mode?: "login" | "signup";
  showDivider?: boolean;
  callbackUrl?: string;
};

/** 카카오·구글 간편 로그인 + 이메일 폼 구분선 */
export function SocialLoginSection({
  mode = "login",
  showDivider = true,
  callbackUrl = "/",
}: SocialLoginSectionProps) {
  const { completeLogin } = useAuthSessionSync();
  const { showToast } = useToast();
  const isSignup = mode === "signup";

  return (
    <div className="space-y-3">
      {!isSignup && (
        <>
          <KakaoLoginButton callbackUrl={callbackUrl} />
          <p className="text-center text-[11px] leading-snug text-muted-foreground">
            이메일로 가입한 계정과 <strong className="font-medium">같은 이메일</strong>
            의 카카오로 로그인됩니다. 모바일에서는 카카오톡 앱으로 이동할 수
            있습니다.
          </p>
        </>
      )}

      {isSignup && (
        <p className="rounded-lg bg-secondary/80 px-3 py-2.5 text-center text-xs leading-relaxed text-muted-foreground">
          카카오로는 아직 가입할 수 없습니다. 이메일로 가입한 뒤{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            로그인
          </Link>
          에서 카카오를 연동해 주세요.
        </p>
      )}

      <GoogleSignInButton
        callbackUrl={callbackUrl}
        onSuccess={() => void completeLogin({ callbackUrl })}
        onError={(msg) => showToast(msg, "error")}
      />

      {showDivider && <SocialLoginDivider />}
    </div>
  );
}
