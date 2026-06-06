import Script from "next/script";
import { getAdSenseClientId } from "@/lib/ads/adsense-config";

/** AdSense 로더 — NEXT_PUBLIC_ADSENSE_CLIENT 설정 시에만 주입 */
export function AdSenseScript() {
  const client = getAdSenseClientId();
  if (!client) return null;

  return (
    <Script
      id="adsense-loader"
      async
      crossOrigin="anonymous"
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}`}
      strategy="afterInteractive"
    />
  );
}
