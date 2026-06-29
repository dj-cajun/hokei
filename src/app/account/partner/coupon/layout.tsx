"use client";

import { usePathname } from "next/navigation";
import { PartnerCouponStaffGate } from "@/components/coupon/partner-coupon-staff-gate";
import { PARTNER_COUPON_BASE } from "@/lib/coupon/config";

export default function PartnerCouponLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const skipStaff =
    pathname === PARTNER_COUPON_BASE || pathname === `${PARTNER_COUPON_BASE}/login`;

  if (skipStaff) {
    return <>{children}</>;
  }

  return <PartnerCouponStaffGate>{() => children}</PartnerCouponStaffGate>;
}
