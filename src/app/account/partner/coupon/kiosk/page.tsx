import type { Metadata } from "next";
import { PartnerCouponKiosk } from "@/components/coupon/partner-coupon-kiosk";

export const metadata: Metadata = {
  title: "키오스크 스캐너 - 호케이",
  robots: { index: false, follow: false },
};

export default function PartnerCouponKioskPage() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black text-white">
      <header className="border-b border-white/10 px-4 py-3 text-center">
        <h1 className="text-lg font-bold">쿠폰 키오스크</h1>
      </header>
      <main className="flex-1 overflow-y-auto">
        <PartnerCouponKiosk />
      </main>
    </div>
  );
}
