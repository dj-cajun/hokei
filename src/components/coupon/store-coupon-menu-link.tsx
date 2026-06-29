"use client";

import Link from "next/link";
import { COUPON_WALLET_SHORT } from "@/lib/coupon/labels";
import { storeCouponBase } from "@/lib/coupon/config";

type StoreCouponMenuLinkProps = {
  slug: string;
};

export function StoreCouponMenuLink({ slug }: StoreCouponMenuLinkProps) {
  const base = storeCouponBase(slug);
  return (
    <div className="mt-4 flex flex-col gap-2 sm:flex-row">
      <Link
        href={base}
        className="flex min-h-11 flex-1 items-center justify-center rounded-lg bg-primary px-4 text-sm font-bold text-primary-foreground hover:opacity-90"
      >
        ☕ 쿠폰으로 구매
      </Link>
      <Link
        href={`${base}/wallet`}
        className="flex min-h-11 flex-1 items-center justify-center rounded-lg border border-border bg-secondary px-4 text-sm font-semibold text-foreground hover:bg-card-hover"
      >
        {COUPON_WALLET_SHORT}
      </Link>
    </div>
  );
}
