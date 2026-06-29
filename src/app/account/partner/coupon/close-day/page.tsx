"use client";

import Link from "next/link";
import { useState } from "react";
import { couponFetch } from "@/lib/coupon/api";
import { PARTNER_COUPON_BASE } from "@/lib/coupon/config";
import { usePartnerCouponAuth } from "@/components/coupon/use-partner-coupon-auth";

type CloseDayResult = {
  date: string;
  redemptionCount: number;
  cashConfirmedCount: number;
  platformFeeTotal: number;
  duplicate: boolean;
};

export default function PartnerCouponCloseDayPage() {
  const { state } = usePartnerCouponAuth();
  const [result, setResult] = useState<CloseDayResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function runCloseDay() {
    setLoading(true);
    setError("");
    try {
      const data = await couponFetch<CloseDayResult>("/staff/close-day", {
        method: "POST",
        agency: true,
      });
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "마감 실패");
    } finally {
      setLoading(false);
    }
  }

  if (state.status === "loading") {
    return <div className="px-4 py-6 text-sm text-muted-foreground">연결 중...</div>;
  }

  if (state.status === "needs_login") return null;

  return (
    <div className="mx-auto w-full max-w-md flex-1 px-4 py-6">
      <h1 className="text-xl font-bold">일 마감</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        베트남 현지일 기준 · 매니저만 실행 (교환·현금·수수료 집계)
      </p>
      <button
        type="button"
        onClick={runCloseDay}
        disabled={loading}
        className="mt-6 min-h-11 w-full rounded-lg bg-primary text-sm font-bold text-primary-foreground disabled:opacity-50"
      >
        {loading ? "마감 중..." : "오늘 마감하기"}
      </button>
      {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
      {result ? (
        <div className="mt-6 rounded-xl border border-border-light bg-surface p-4 text-sm">
          <p className="font-semibold">{result.date}</p>
          {result.duplicate ? (
            <p className="mt-1 text-muted-foreground">이미 마감된 날짜입니다.</p>
          ) : null}
          <dl className="mt-3 space-y-1">
            <div className="flex justify-between">
              <dt>교환</dt>
              <dd className="font-medium">{result.redemptionCount}건</dd>
            </div>
            <div className="flex justify-between">
              <dt>현금 수령</dt>
              <dd className="font-medium">{result.cashConfirmedCount}건</dd>
            </div>
            <div className="flex justify-between">
              <dt>플랫폼 수수료</dt>
              <dd className="font-bold text-primary">
                {result.platformFeeTotal.toLocaleString()}₫
              </dd>
            </div>
          </dl>
        </div>
      ) : null}
      <Link
        href={PARTNER_COUPON_BASE}
        className="mt-6 block text-center text-sm text-primary hover:underline"
      >
        ← 쿠폰 관리
      </Link>
    </div>
  );
}
