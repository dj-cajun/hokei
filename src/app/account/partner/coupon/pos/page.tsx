import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PartnerCouponPosPanel } from "@/components/coupon/partner-coupon-pos-panel";
import { PARTNER_COUPON_BASE } from "@/lib/coupon/config";

export const metadata: Metadata = {
  title: "POS 연동 - 호케이",
  robots: { index: false, follow: false },
};

export default function PartnerCouponPosPage() {
  return (
    <div className="mx-auto w-full max-w-lg flex-1 px-4 py-6">
      <Link
        href={PARTNER_COUPON_BASE}
        className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        쿠폰 관리
      </Link>
      <h1 className="text-xl font-bold">POS · 외부 스캐너</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        API 키 발급 · 키오스크는{" "}
        <Link href={`${PARTNER_COUPON_BASE}/kiosk`} className="text-primary hover:underline">
          전체화면 모드
        </Link>
      </p>
      <div className="mt-6">
        <PartnerCouponPosPanel />
      </div>
    </div>
  );
}
