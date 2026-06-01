"use client";

import { KakaoLoginButton } from "@/components/auth/kakao-login-button";
import { SocialLoginDivider } from "@/components/auth/social-login-divider";

type SocialLoginSectionProps = {
  mode?: "login" | "signup";
  showDivider?: boolean;
};

/** 이메일 폼 위·아래에 배치하는 카카오 간편 로그인 블록 */
export function SocialLoginSection({
  mode = "login",
  showDivider = true,
}: SocialLoginSectionProps) {
  return (
    <div className="space-y-3">
      <KakaoLoginButton variant={mode === "signup" ? "start" : "login"} />
      <p className="text-center text-[11px] leading-snug text-muted-foreground">
        모바일에서는 카카오톡 앱으로 이동해 동의 후 로그인됩니다.
      </p>
      {showDivider && <SocialLoginDivider />}
    </div>
  );
}
