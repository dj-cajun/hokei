"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";
import { PARTNER_COUPON_BASE } from "@/lib/coupon/config";
import { stripCouponOrderMarker } from "@/lib/coupon/order-conversation-format";

type CouponConversation = {
  id: string;
  peer: { id: string; name: string };
  contextCouponOrderId?: string | null;
  unreadCount: number;
  lastMessage: { body: string; createdAt: string } | null;
};

export function PartnerCouponMessagesPanel() {
  const [items, setItems] = useState<CouponConversation[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/conversations");
      const data = await res.json();
      const rows = (data.conversations ?? []) as CouponConversation[];
      setItems(rows.filter((c) => Boolean(c.contextCouponOrderId)));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return <p className="text-sm text-muted-foreground">문의 목록 로딩 중...</p>;
  }

  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        쿠폰 결제 후 자동으로 열리는 고객 문의가 여기에 표시됩니다.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <Link
          key={item.id}
          href={`/messages/${item.id}`}
          className="flex items-center justify-between gap-3 rounded-xl border border-border-light bg-surface px-4 py-3 hover:bg-secondary"
        >
          <div className="min-w-0">
            <p className="flex items-center gap-2 font-medium">
              <MessageCircle className="h-4 w-4 shrink-0 text-primary" />
              {item.peer.name}
            </p>
            {item.lastMessage ? (
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {stripCouponOrderMarker(item.lastMessage.body).slice(0, 80)}
              </p>
            ) : null}
            {item.contextCouponOrderId ? (
              <p className="mt-1 text-[10px] text-muted-foreground">
                주문 {item.contextCouponOrderId.slice(0, 8).toUpperCase()}
              </p>
            ) : null}
          </div>
          {item.unreadCount > 0 ? (
            <span className="shrink-0 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
              {item.unreadCount}
            </span>
          ) : null}
        </Link>
      ))}
      <Link
        href="/messages"
        className="mt-2 block text-center text-sm text-primary hover:underline"
      >
        전체 쪽지함 →
      </Link>
      <Link
        href={`${PARTNER_COUPON_BASE}/orders`}
        className="block text-center text-xs text-muted-foreground hover:text-primary"
      >
        현금 결제 주문 보기
      </Link>
    </div>
  );
}
