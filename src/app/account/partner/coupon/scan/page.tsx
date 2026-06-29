import type { Metadata } from "next";
import { PartnerCouponScanner } from "@/components/coupon/partner-coupon-scanner";

export const metadata: Metadata = {
  title: "QR 스캐너 - 호케이",
  robots: { index: false, follow: false },
};

export default function PartnerCouponScanPage() {
  return (
    <div className="mx-auto w-full max-w-md flex-1 px-4 py-6">
      <h1 className="text-xl font-bold">QR 스캐너</h1>
      <div className="mt-4">
        <PartnerCouponScanner />
      </div>
    </div>
  );
}
