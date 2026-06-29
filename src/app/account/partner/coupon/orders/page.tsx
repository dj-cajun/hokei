"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PartnerCouponPendingCashPanel } from "@/components/coupon/partner-coupon-pending-cash-panel";
import { usePartnerCouponAuth } from "@/components/coupon/use-partner-coupon-auth";
import { PARTNER_COUPON_BASE } from "@/lib/coupon/config";

export default function PartnerCouponOrdersPage() {
  const { state } = usePartnerCouponAuth();

  if (state.status === "loading") {
    return <div className="px-4 py-6 text-sm text-muted-foreground">쿠폰 계정 연결 중...</div>;
  }

  if (state.status === "needs_login") {
    return null;
  }

  return (
    <div className="mx-auto w-full max-w-md flex-1 px-4 py-6">
      <Link
        href={PARTNER_COUPON_BASE}
        className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        쿠폰 관리
      </Link>
      <h1 className="text-xl font-bold">현금 결제 대기</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        손님이 매장 현금으로 결제한 주문을 확인하면 쿠폰이 발급됩니다.
      </p>
      <div className="mt-4">
        <PartnerCouponPendingCashPanel />
      </div>
    </div>
  );
}
