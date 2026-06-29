"use client";

import { useEffect, useState } from "react";
import { couponFetch } from "@/lib/coupon/api";

type PendingOrder = {
  id: string;
  amount: string;
  createdAt: string;
  product: { name: string };
  user: { name: string; email: string | null };
};

export function AdminCouponPendingPanel() {
  const [orders, setOrders] = useState<PendingOrder[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    const data = await couponFetch<PendingOrder[]>("/admin/orders/pending");
    setOrders(data);
  }

  useEffect(() => {
    load();
  }, []);

  async function refresh() {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  }

  async function approve(id: string) {
    await couponFetch(`/admin/orders/${id}/approve`, { method: "POST" });
    await load();
    alert("승인 완료 — 쿠폰이 발급되었습니다.");
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={refresh}
          disabled={refreshing}
          className="text-sm text-primary hover:underline disabled:opacity-50"
        >
          {refreshing ? "새로고침 중..." : "목록 새로고침"}
        </button>
      </div>
      {orders.length === 0 ? (
        <p className="text-sm text-muted-foreground">대기 중인 입금이 없습니다.</p>
      ) : null}
      {orders.map((o) => (
        <div
          key={o.id}
          className="rounded-xl border border-border-light bg-surface p-4"
        >
          <p className="font-semibold">{o.product.name}</p>
          <p className="text-sm">{Number(o.amount).toLocaleString()}₫</p>
          <p className="text-xs text-muted-foreground">
            {o.user.name} {o.user.email ? `(${o.user.email})` : ""}
          </p>
          <p className="text-xs text-muted-foreground">
            주문 {o.id.slice(0, 8).toUpperCase()} ·{" "}
            {new Date(o.createdAt).toLocaleString("ko-KR")}
          </p>
          <button
            type="button"
            onClick={() => approve(o.id)}
            className="mt-3 min-h-9 rounded-lg bg-primary px-4 text-sm font-bold text-primary-foreground"
          >
            승인 및 쿠폰 발급
          </button>
        </div>
      ))}
    </div>
  );
}
