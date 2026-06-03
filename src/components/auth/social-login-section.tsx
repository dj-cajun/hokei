"use client";

import { useAuthSessionSync } from "@/hooks/use-auth-session-sync";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { SocialLoginDivider } from "@/components/auth/social-login-divider";
import { useToast } from "@/components/providers/toast-provider";

type SocialLoginSectionProps = {
  mode?: "login" | "signup";
  showDivider?: boolean;
  callbackUrl?: string;
};

/** 구글 간편 로그인 + 이메일 폼 구분선 */
export function SocialLoginSection({
  showDivider = true,
  callbackUrl = "/",
}: SocialLoginSectionProps) {
  const { completeLogin } = useAuthSessionSync();
  const { showToast } = useToast();

  return (
    <div className="space-y-3">
      <GoogleSignInButton
        callbackUrl={callbackUrl}
        onSuccess={() => void completeLogin({ callbackUrl })}
        onError={(msg) => showToast(msg, "error")}
      />

      {showDivider && <SocialLoginDivider />}
    </div>
  );
}
