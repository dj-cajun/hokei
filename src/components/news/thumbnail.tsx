"use client";

import { useCallback, useMemo, useState } from "react";
import type { PostTopic } from "@/generated/prisma/client";
import { cn } from "@/lib/utils";
import {
  getFallbackDisplayUrl,
  getThumbnailDisplayUrl,
} from "@/lib/news/thumbnail-display";

type NewsThumbnailProps = {
  src?: string | null;
  sourceUrl?: string | null;
  topic?: PostTopic;
  alt?: string;
  className?: string;
};

type LoadPhase = "primary" | "retry" | "fallback";

/** 외부 뉴스 썸네일 — 실패 시 1회 재시도 후 토픽별 기본 이미지 */
export function NewsThumbnail({
  src,
  sourceUrl,
  topic = "KOREA",
  alt = "",
  className,
}: NewsThumbnailProps) {
  const [phase, setPhase] = useState<LoadPhase>("primary");

  const fallbackUrl = getFallbackDisplayUrl(topic);

  const primaryUrl = useMemo(
    () => getThumbnailDisplayUrl(src, sourceUrl, topic),
    [src, sourceUrl, topic]
  );

  const retryUrl = useMemo(() => {
    if (!primaryUrl || primaryUrl.includes("images.unsplash.com")) {
      return undefined;
    }
    const sep = primaryUrl.includes("?") ? "&" : "?";
    return `${primaryUrl}${sep}retry=1`;
  }, [primaryUrl]);

  const displaySrc =
    phase === "fallback"
      ? fallbackUrl
      : phase === "retry"
        ? retryUrl ?? fallbackUrl
        : primaryUrl ?? fallbackUrl;

  const handleError = useCallback(() => {
    setPhase((current) => {
      if (current === "primary" && retryUrl) return "retry";
      return "fallback";
    });
  }, [retryUrl]);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={displaySrc}
      alt={alt}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      className={cn("h-full w-full object-cover", className)}
      onError={handleError}
    />
  );
}
