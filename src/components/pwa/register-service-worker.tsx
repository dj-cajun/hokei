"use client";

import { useEffect } from "react";

export function RegisterServiceWorker() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV === "development") return;

    const timer = window.setTimeout(() => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        /* SW 등록 실패 — PWA 선택 기능 */
      });
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  return null;
}
