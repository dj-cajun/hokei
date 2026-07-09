import Script from "next/script";
import { getAdSenseClientId } from "@/lib/ads/adsense-config";

/** AdSense 심사용 로더 — `<head>`에 async 주입 (Google 제공 스니펫과 동일) */
export function AdSenseScript() {
  const client = getAdSenseClientId();
  if (!client) return null;

  return (
    <Script
      id="adsense-loader"
      async
      crossOrigin="anonymous"
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}`}
      strategy="beforeInteractive"
    />
  );
}
