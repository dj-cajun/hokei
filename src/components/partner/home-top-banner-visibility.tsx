"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { homeTopBannerDismissCookie } from "@/lib/partner/home-top-banner-cookie";

const DISMISS_PREFIX = "hokei_htb_dismiss_";

const dismissListeners = new Set<() => void>();

function subscribeDismiss(listener: () => void) {
  dismissListeners.add(listener);
  return () => dismissListeners.delete(listener);
}

function notifyDismiss() {
  dismissListeners.forEach((listener) => listener());
}

function isBannerDismissed(bannerId: string): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(`${DISMISS_PREFIX}${bannerId}`) === "1";
}

const DismissCtx = createContext<(() => void) | null>(null);

export function useHomeTopBannerDismiss() {
  const fn = useContext(DismissCtx);
  if (!fn) throw new Error("HomeTopBannerDismissProvider required");
  return fn;
}

type HomeTopBannerVisibilityProps = {
  bannerId: string;
  children: ReactNode;
};

/** 닫기는 localStorage — 서버 쿠키로 배너가 통째로 사라지지 않게 */
export function HomeTopBannerVisibility({
  bannerId,
  children,
}: HomeTopBannerVisibilityProps) {
  const visible = useSyncExternalStore(
    subscribeDismiss,
    () => !isBannerDismissed(bannerId),
    () => true
  );

  useEffect(() => {
    const legacy = homeTopBannerDismissCookie(bannerId);
    if (document.cookie.includes(`${legacy}=1`)) {
      document.cookie = `${legacy}=; Max-Age=0; Path=/; SameSite=Lax`;
    }
  }, [bannerId]);

  const dismiss = useCallback(() => {
    localStorage.setItem(`${DISMISS_PREFIX}${bannerId}`, "1");
    notifyDismiss();
  }, [bannerId]);

  if (!visible) return null;

  return <DismissCtx.Provider value={dismiss}>{children}</DismissCtx.Provider>;
}
