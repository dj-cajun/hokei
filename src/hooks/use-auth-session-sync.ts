"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { safeCallbackPath } from "@/lib/auth/safe-callback-url";

type CompleteLoginOptions = {
  callbackUrl?: string;
  onSuccess?: () => void;
  /** 서버 컴포넌트 갱신 (기본: 백그라운드) */
  refreshServer?: boolean;
};

/**
 * 로그인 직후 useSession을 즉시 갱신해 헤더 UI 플래시를 줄입니다.
 */
export function useAuthSessionSync() {
  const { update } = useSession();
  const router = useRouter();

  const completeLogin = useCallback(
    async (options?: CompleteLoginOptions) => {
      await update();
      options?.onSuccess?.();

      const dest = safeCallbackPath(options?.callbackUrl);
      if (dest !== "/") {
        router.push(dest);
      }

      if (options?.refreshServer !== false) {
        void router.refresh();
      }
    },
    [update, router]
  );

  return { completeLogin };
}
