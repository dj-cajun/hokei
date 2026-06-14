"use client";

import { useCallback, useMemo, useState } from "react";
import type { PostTopic } from "@/lib/post-topic";
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

function NewsThumbnailInner({
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
    if (!primaryUrl?.startsWith("/api/news/thumbnail")) {
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
        : primaryUrl;

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

/** 뉴스 썸네일 — 프록시 → 재시도 → 토픽별 정적 폴백 */
export function NewsThumbnail(props: NewsThumbnailProps) {
  const resetKey = `${props.src ?? ""}|${props.sourceUrl ?? ""}|${props.topic ?? "KOREA"}`;
  return <NewsThumbnailInner key={resetKey} {...props} />;
}
