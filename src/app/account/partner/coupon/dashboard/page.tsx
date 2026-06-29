"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { couponFetch } from "@/lib/coupon/api";
import { PARTNER_COUPON_BASE } from "@/lib/coupon/config";
import type { DashboardSummary } from "@/lib/coupon/types";
import { usePartnerCouponAuth } from "@/components/coupon/use-partner-coupon-auth";

export default function PartnerCouponDashboardPage() {
  const { state } = usePartnerCouponAuth();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);

  useEffect(() => {
    if (state.status !== "ready") return;
    couponFetch<DashboardSummary>("/dashboard/summary", { agency: true }).then(setSummary);
  }, [state.status]);

  if (state.status === "loading") {
    return <div className="px-4 py-6 text-sm text-muted-foreground">쿠폰 계정 연결 중...</div>;
  }

  if (state.status === "needs_login") {
    return null;
  }

  if (!summary) {
    return <div className="px-4 py-6 text-sm text-muted-foreground">로딩 중...</div>;
  }

  const weekPlatformFee = summary.weekPlatformFee ?? summary.weekRevenue ?? 0;
  const pendingPlatformFee = summary.pendingPlatformFee ?? summary.pendingBalance ?? 0;

  return (
    <div className="mx-auto w-full max-w-md flex-1 px-4 py-6">
      <h1 className="text-xl font-bold">수수료 대시보드</h1>
      <p className="mt-1 text-xs text-muted-foreground">
        건당 {summary.commissionFixed.toLocaleString()}₫ · 손님 결제금은 매장 직수금
      </p>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-secondary p-4">
          <p className="text-xs text-muted-foreground">이번 주 교환</p>
          <p className="mt-1 text-lg font-bold">{summary.weekCount}건</p>
        </div>
        <div className="rounded-xl bg-secondary p-4">
          <p className="text-xs text-muted-foreground">이번 주 수수료</p>
          <p className="mt-1 text-lg font-bold">{weekPlatformFee.toLocaleString()}₫</p>
        </div>
        <div className="rounded-xl bg-secondary p-4">
          <p className="text-xs text-muted-foreground">납부 예정 수수료</p>
          <p className="mt-1 text-lg font-bold">{pendingPlatformFee.toLocaleString()}₫</p>
        </div>
        <div className="rounded-xl bg-secondary p-4">
          <p className="text-xs text-muted-foreground">다음 정산일</p>
          <p className="mt-1 text-sm font-bold">
            {new Date(summary.nextSettlementDate).toLocaleDateString("ko-KR", {
              month: "short",
              day: "numeric",
            })}
          </p>
        </div>
      </div>
      <Link
        href={PARTNER_COUPON_BASE}
        className="mt-6 block text-center text-sm text-primary hover:underline"
      >
        ← 쿠폰 관리
      </Link>
    </div>
  );
}
