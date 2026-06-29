"use client";

import { useCallback, useEffect, useState } from "react";
import { couponFetch } from "@/lib/coupon/api";
import type { PendingCashOrderDto } from "@/lib/coupon/types";

export function PartnerCouponPendingCashPanel() {
  const [items, setItems] = useState<PendingCashOrderDto[]>([]);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const data = await couponFetch<PendingCashOrderDto[]>("/orders/agency/pending-cash", {
      agency: true,
    });
    setItems(data);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function confirmCash(id: string) {
    if (!confirm("현금 수령을 확인하고 쿠폰을 발급할까요?")) return;
    setLoadingId(id);
    try {
      await couponFetch(`/orders/${id}/confirm-cash`, {
        method: "POST",
        agency: true,
      });
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "확인 실패");
    } finally {
      setLoadingId(null);
    }
  }

  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">현금 결제 대기 주문이 없습니다.</p>
    );
  }

  return (
    <ul className="space-y-3">
      {items.map((o) => (
        <li
          key={o.id}
          className="rounded-xl border border-border-light bg-surface p-4"
        >
          <div className="font-semibold">{o.productName}</div>
          <div className="mt-1 text-sm text-muted-foreground">
            {o.buyerName} · {o.amount.toLocaleString()}₫
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            {new Date(o.createdAt).toLocaleString("ko-KR")}
          </div>
          <button
            type="button"
            disabled={loadingId === o.id}
            onClick={() => void confirmCash(o.id)}
            className="mt-3 flex min-h-10 w-full items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground disabled:opacity-50"
          >
            {loadingId === o.id ? "처리 중..." : "현금 수령 · 쿠폰 발급"}
          </button>
        </li>
      ))}
    </ul>
  );
}
