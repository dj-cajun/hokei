"use client";

import type { PartnerEventType } from "@/generated/prisma/client";
import { toTelHref } from "@/lib/partner/phone";
import { trackPartnerEvent } from "@/lib/partner/track-event";

type StoreCtaBarProps = {
  slug: string;
  kakaoLink: string | null;
  phone: string | null;
  mapsUrl: string | null;
};

function trackClick(slug: string, eventType: PartnerEventType) {
  trackPartnerEvent(slug, eventType);
}

export function StoreCtaBar({
  slug,
  kakaoLink,
  phone,
  mapsUrl,
}: StoreCtaBarProps) {
  const telHref = phone?.trim() ? toTelHref(phone) : "";
  const hasKakao = Boolean(kakaoLink?.trim());
  const hasTel = Boolean(telHref);
  const hasMaps = Boolean(mapsUrl?.trim());

  if (!hasKakao && !hasTel && !hasMaps) {
    return null;
  }

  return (
    <div className="sticky bottom-0 z-10 border-t border-border-light bg-surface/95 px-3 py-2 backdrop-blur supports-[backdrop-filter]:bg-surface/80">
      <div className="mx-auto flex max-w-[480px] gap-2">
        {hasKakao && (
          <a
            href={kakaoLink!}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackClick(slug, "KAKAO_CLICK")}
            className="flex min-h-11 flex-1 items-center justify-center rounded-lg bg-[#FEE500] px-3 text-sm font-bold text-[#3C1E1E] hover:opacity-90"
          >
            카톡
          </a>
        )}
        {hasTel && (
          <a
            href={telHref}
            onClick={() => trackClick(slug, "PHONE_CLICK")}
            className="flex min-h-11 flex-1 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 px-3 text-sm font-semibold text-emerald-800 hover:bg-emerald-100"
          >
            전화
          </a>
        )}
        {hasMaps && (
          <a
            href={mapsUrl!}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackClick(slug, "MAPS_CLICK")}
            className="flex min-h-11 flex-1 items-center justify-center rounded-lg border border-border bg-secondary px-3 text-sm font-semibold text-foreground hover:bg-card-hover"
          >
            길찾기
          </a>
        )}
      </div>
    </div>
  );
}
