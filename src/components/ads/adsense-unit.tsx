"use client";

import { useEffect, useRef } from "react";
import {
  getAdSenseClientId,
  getAdSenseSlot,
  isAdSenseEnabled,
  type AdSenseSlotKind,
} from "@/lib/ads/adsense-config";
import { cn } from "@/lib/utils";

type AdSenseUnitProps = {
  slotKind: AdSenseSlotKind;
  className?: string;
};

declare global {
  interface Window {
    adsbygoogle?: Record<string, unknown>[];
  }
}

export function AdSenseUnit({ slotKind, className }: AdSenseUnitProps) {
  const pushed = useRef(false);
  const client = getAdSenseClientId();
  const slot = getAdSenseSlot(slotKind);

  useEffect(() => {
    if (!client || !slot || pushed.current) return;
    pushed.current = true;
    try {
      (window.adsbygoogle = window.adsbygoogle ?? []).push({});
    } catch {
      /* AdSense 미로드 */
    }
  }, [client, slot]);

  if (!isAdSenseEnabled() || !client || !slot) {
    return null;
  }

  return (
    <div
      className={cn("my-4 flex min-h-[90px] justify-center", className)}
      aria-label="광고"
    >
      <ins
        className="adsbygoogle block w-full"
        style={{ display: "block" }}
        data-ad-client={client}
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
