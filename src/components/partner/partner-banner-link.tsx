"use client";

import Link from "next/link";
import { trackPartnerEvent } from "@/lib/partner/track-event";

type PartnerBannerLinkProps = {
  href: string;
  slug: string;
  className?: string;
  children: React.ReactNode;
};

export function PartnerBannerLink({
  href,
  slug,
  className,
  children,
}: PartnerBannerLinkProps) {
  return (
    <Link
      href={href}
      className={className}
      onClick={() => trackPartnerEvent(slug, "BANNER_CLICK")}
    >
      {children}
    </Link>
  );
}
