"use client";

import { useEffect } from "react";
import { trackPartnerEvent } from "@/lib/partner/track-event";

type StoreViewTrackerProps = {
  slug: string;
};

export function StoreViewTracker({ slug }: StoreViewTrackerProps) {
  useEffect(() => {
    trackPartnerEvent(slug, "VIEW");
  }, [slug]);

  return null;
}
