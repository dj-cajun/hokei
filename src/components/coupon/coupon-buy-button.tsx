"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { couponFetch } from "@/lib/coupon/api";
import { paymentMethodLabel } from "@/lib/coupon/labels";
import { storeCouponBase } from "@/lib/coupon/config";
import type { OrderDto, ProductDto } from "@/lib/coupon/types";

type PaymentMethod = "bank_qr" | "cash_at_store";

export function CouponBuyButton({
  slug,
  productId,
  product,
}: {
  slug: string;
  productId: string;
  product: ProductDto;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("bank_qr");
  const base = storeCouponBase(slug);

  async function handleBuy() {
    setLoading(true);
    try {
      const order = await couponFetch<OrderDto>("/orders", {
        method: "POST",
        body: JSON.stringify({ productId, paymentMethod }),
      });
      router.push(`${base}/checkout/${order.id}`);
    } catch (e) {
      alert(e instanceof Error ? e.message : "주문 실패");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-border-light bg-surface p-4">
      <h1 className="text-xl font-bold">{product.name}</h1>
      {product.description ? (
        <p className="mt-2 text-sm text-muted-foreground">{product.description}</p>
      ) : null}
      <p className="mt-3 text-2xl font-bold text-primary">
        {product.price.toLocaleString()}₫
      </p>

      <fieldset className="mt-4 space-y-2">
        <legend className="text-sm font-semibold">결제 방식</legend>
        {(["bank_qr", "cash_at_store"] as const).map((method) => (
          <label
            key={method}
            className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border border-border-light px-3 has-[:checked]:border-primary has-[:checked]:bg-primary/5"
          >
            <input
              type="radio"
              name="paymentMethod"
              value={method}
              checked={paymentMethod === method}
              onChange={() => setPaymentMethod(method)}
              className="h-4 w-4"
            />
            <span className="text-sm">{paymentMethodLabel(method)}</span>
          </label>
        ))}
      </fieldset>

      <button
        type="button"
        onClick={handleBuy}
        disabled={loading}
        className="mt-4 flex min-h-11 w-full items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground disabled:opacity-50"
      >
        {loading ? "처리 중..." : "쿠폰 구매하기"}
      </button>
      <Link
        href={`/store/${slug}/coupon`}
        className="mt-3 block text-center text-sm text-muted-foreground hover:text-primary"
      >
        목록으로
      </Link>
    </div>
  );
}
