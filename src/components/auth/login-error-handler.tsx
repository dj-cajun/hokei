"use client";

import { Suspense, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/components/providers/toast-provider";
import { messageFromLoginErrorParam } from "@/lib/auth/login-error-messages";

function LoginErrorHandlerInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { showToast } = useToast();
  const loginError = searchParams.get("login_error");
  const handledRef = useRef<string | null>(null);

  useEffect(() => {
    if (!loginError) {
      handledRef.current = null;
      return;
    }
    if (handledRef.current === loginError) return;

    const message = messageFromLoginErrorParam(loginError);
    handledRef.current = loginError;
    if (!message) return;

    showToast(message, "error");

    const next = new URLSearchParams(window.location.search);
    next.delete("login_error");
    const qs = next.toString();
    const path = window.location.pathname;
    router.replace(qs ? `${path}?${qs}` : path, { scroll: false });
  }, [loginError, router, showToast]);

  return null;
}

export function LoginErrorHandler() {
  return (
    <Suspense fallback={null}>
      <LoginErrorHandlerInner />
    </Suspense>
  );
}
