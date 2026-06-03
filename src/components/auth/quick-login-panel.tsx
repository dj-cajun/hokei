"use client";

import { useState } from "react";
import Link from "next/link";
import { AuthForm } from "@/components/auth/auth-form";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { SocialLoginDivider } from "@/components/auth/social-login-divider";
import { useAuthSessionSync } from "@/hooks/use-auth-session-sync";
import { useToast } from "@/components/providers/toast-provider";

type QuickLoginPanelProps = {
  callbackUrl: string;
  onClose?: () => void;
  onSuccess?: () => void;
};

export function QuickLoginPanel({
  callbackUrl,
  onClose,
  onSuccess,
}: QuickLoginPanelProps) {
  const { showToast } = useToast();
  const { completeLogin } = useAuthSessionSync();
  const [showEmail, setShowEmail] = useState(false);

  const finish = () => {
    void completeLogin({
      callbackUrl,
      onSuccess: () => {
        onClose?.();
        onSuccess?.();
      },
    });
  };

  if (!showEmail) {
    return (
      <div className="space-y-3">
        <GoogleSignInButton
          callbackUrl={callbackUrl}
          onSuccess={finish}
          onError={(msg) => showToast(msg, "error")}
        />

        <SocialLoginDivider />

        <button
          type="button"
          onClick={() => setShowEmail(true)}
          className="flex h-11 w-full items-center justify-center rounded-xl border border-[#e5e7eb] text-sm font-medium text-foreground hover:bg-secondary/60"
        >
          이메일로 로그인
        </button>

        <p className="text-center text-xs text-muted-foreground">
          계정이 없으신가요?{" "}
          <Link
            href="/signup"
            className="font-medium text-primary"
            onClick={onClose}
          >
            회원가입
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => setShowEmail(false)}
        className="text-sm text-primary hover:underline"
      >
        ← 간편 로그인으로
      </button>
      <AuthForm
        mode="login"
        callbackUrl={callbackUrl}
        onSuccess={() => {
          onClose?.();
          onSuccess?.();
        }}
        embedded
      />
    </div>
  );
}
