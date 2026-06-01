"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useSession } from "next-auth/react";
import { X } from "lucide-react";
import { AuthForm } from "@/components/auth/auth-form";
import { GoogleOneTap } from "@/components/auth/google-one-tap";
import { KakaoLoginButton } from "@/components/auth/kakao-login-button";
import { SocialLoginDivider } from "@/components/auth/social-login-divider";
import { useToast } from "@/components/providers/toast-provider";
import { postGoogleCredential } from "@/lib/auth/google-credential-client";
import { parseApiError } from "@/lib/api-response";
import {
  getGoogleClientId,
  renderGoogleSignInButton,
} from "@/lib/auth/google-one-tap";
import { cn } from "@/lib/utils";
import Link from "next/link";

type LoginModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  callbackUrl: string;
  onSuccess?: () => void;
};

export function LoginModal({
  open,
  onOpenChange,
  callbackUrl,
  onSuccess,
}: LoginModalProps) {
  const { status } = useSession();

  useEffect(() => {
    if (status === "authenticated" && open) {
      onOpenChange(false);
      onSuccess?.();
    }
  }, [status, open, onOpenChange, onSuccess]);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className={cn(
            "fixed inset-0 z-[100] bg-black/45",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
          )}
        />
        <DialogPrimitive.Content
          className={cn(
            "fixed inset-x-0 bottom-0 z-[101] mx-auto flex max-h-[92dvh] w-full max-w-md flex-col rounded-t-2xl bg-white shadow-2xl outline-none",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom duration-300",
            "pb-[max(1rem,env(safe-area-inset-bottom))]"
          )}
          aria-describedby={undefined}
        >
          {open && <GoogleOneTap enabled />}

          <div className="flex shrink-0 justify-center pt-2.5">
            <span className="h-1 w-10 rounded-full bg-[#e5e7eb]" aria-hidden />
          </div>

          <div className="flex items-start justify-between px-4 pt-2">
            <div>
              <DialogPrimitive.Title className="text-lg font-bold text-foreground">
                로그인
              </DialogPrimitive.Title>
              <DialogPrimitive.Description className="mt-0.5 text-sm text-muted-foreground">
                카카오·구글로 1초 만에 시작하세요
              </DialogPrimitive.Description>
            </div>
            <DialogPrimitive.Close
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary"
              aria-label="닫기"
            >
              <X className="h-5 w-5" />
            </DialogPrimitive.Close>
          </div>

          <div className="flex-1 overflow-y-auto px-4 pb-4 pt-3">
            {open && (
              <LoginModalPanel
                callbackUrl={callbackUrl}
                onClose={() => onOpenChange(false)}
                onSuccess={onSuccess}
              />
            )}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

function LoginModalPanel({
  callbackUrl,
  onClose,
  onSuccess,
}: {
  callbackUrl: string;
  onClose: () => void;
  onSuccess?: () => void;
}) {
  const { showToast } = useToast();
  const [showEmail, setShowEmail] = useState(false);
  const googleBtnRef = useRef<HTMLDivElement>(null);
  const googleConfigured = Boolean(getGoogleClientId());

  const handleGoogleCredential = useCallback(
    async (response: { credential?: string }) => {
      if (!response.credential) return;
      try {
        await postGoogleCredential(response.credential);
        onClose();
        onSuccess?.();
        window.location.reload();
      } catch (err) {
        const msg =
          err instanceof Error
            ? err.message
            : parseApiError(err) ?? "구글 로그인에 실패했습니다.";
        showToast(msg, "error");
      }
    },
    [onClose, onSuccess, showToast]
  );

  useEffect(() => {
    const el = googleBtnRef.current;
    if (!el || !googleConfigured) return;

    let cancelled = false;
    const timer = window.setTimeout(() => {
      renderGoogleSignInButton(el, handleGoogleCredential).catch(() => {
        if (!cancelled) el.innerHTML = "";
      });
    }, 120);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      el.replaceChildren();
    };
  }, [googleConfigured, handleGoogleCredential]);

  if (!showEmail) {
    return (
      <div className="space-y-3">
        <KakaoLoginButton />
        {googleConfigured ? (
          <div
            ref={googleBtnRef}
            className="flex min-h-[44px] w-full justify-center [&>div]:!w-full"
          />
        ) : (
          <p className="rounded-lg bg-secondary px-3 py-2 text-center text-xs text-muted-foreground">
            구글 로그인: NEXT_PUBLIC_GOOGLE_CLIENT_ID 설정 필요
          </p>
        )}

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
          onClose();
          onSuccess?.();
        }}
        embedded
      />
    </div>
  );
}
