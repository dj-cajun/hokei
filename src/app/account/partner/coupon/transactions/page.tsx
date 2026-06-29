"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { couponFetch } from "@/lib/coupon/api";
import { PARTNER_COUPON_BASE } from "@/lib/coupon/config";
import type { TransactionDto } from "@/lib/coupon/types";
import { usePartnerCouponAuth } from "@/components/coupon/use-partner-coupon-auth";

export default function PartnerCouponTransactionsPage() {
  const { state } = usePartnerCouponAuth();
  const [items, setItems] = useState<TransactionDto[]>([]);

  useEffect(() => {
    if (state.status !== "ready") return;
    couponFetch<TransactionDto[]>("/transactions", { agency: true }).then(setItems);
  }, [state.status]);

  if (state.status === "loading") {
    return <div className="px-4 py-6 text-sm text-muted-foreground">쿠폰 계정 연결 중...</div>;
  }

  if (state.status === "needs_login") {
    return null;
  }

  return (
    <div className="mx-auto w-full max-w-md flex-1 px-4 py-6">
      <h1 className="text-xl font-bold">교환 · 수수료 이력</h1>
      <div className="mt-4 space-y-2">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">거래 내역이 없습니다.</p>
        ) : null}
        {items.map((t) => (
          <div
            key={t.id}
            className="flex items-center justify-between rounded-xl border border-border-light bg-surface px-4 py-3"
          >
            <div>
              <p className="font-medium">{t.productName}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(t.occurredAt).toLocaleString("ko-KR")}
                {t.productPrice != null
                  ? ` · 메뉴 ${t.productPrice.toLocaleString()}₫`
                  : ""}
              </p>
            </div>
            <span className="text-right text-sm font-bold text-primary">
              수수료
              <br />
              +{t.amount.toLocaleString()}₫
            </span>
          </div>
        ))}
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
