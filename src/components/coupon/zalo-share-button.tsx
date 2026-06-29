"use client";

import { couponPageUrl, isZaloInAppBrowser, zaloShareUrl } from "@/lib/coupon/zalo";

type Props = {
  slug: string;
  label?: string;
};

export function ZaloShareButton({ slug, label = "Zalo로 공유" }: Props) {
  const siteUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.hokei.vn";
  const pageUrl = couponPageUrl(siteUrl, slug);
  const inZalo =
    typeof navigator !== "undefined" && isZaloInAppBrowser(navigator.userAgent);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(pageUrl);
      alert("쿠폰 링크가 복사되었습니다.");
    } catch {
      alert(pageUrl);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <a
        href={zaloShareUrl(pageUrl)}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex min-h-9 items-center rounded-lg border border-[#0068ff] bg-[#0068ff]/10 px-3 text-sm font-semibold text-[#0068ff]"
      >
        {label}
      </a>
      <button
        type="button"
        onClick={copyLink}
        className="inline-flex min-h-9 items-center rounded-lg border border-border-light px-3 text-sm text-muted-foreground hover:text-primary"
      >
        링크 복사
      </button>
      {inZalo ? (
        <span className="self-center text-xs text-muted-foreground">Zalo 앱에서 열림</span>
      ) : null}
    </div>
  );
}
