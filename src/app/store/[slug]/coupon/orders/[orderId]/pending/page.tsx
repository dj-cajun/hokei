import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAuthWithCallback } from "@/lib/auth-utils";
import { couponServerFetch } from "@/lib/coupon/server-api";
import { isCouponStore, storeCouponBase } from "@/lib/coupon/config";
import { orderStatusLabel, paymentMethodLabel } from "@/lib/coupon/labels";
import type { OrderDto } from "@/lib/coupon/types";

export default async function CouponOrderPendingPage({
  params,
}: {
  params: Promise<{ slug: string; orderId: string }>;
}) {
  const { slug, orderId } = await params;
  if (!isCouponStore(slug)) notFound();

  const base = storeCouponBase(slug);
  await requireAuthWithCallback(`${base}/orders/${orderId}/pending`);

  const order = await couponServerFetch<OrderDto>(`/orders/${orderId}`);
  const statusLabel = orderStatusLabel(order.status);
  const isPendingReview = order.status === "payment_pending_review";
  const isPaid = order.status === "paid";

  const isCash = order.paymentMethod === "cash_at_store";

  return (
    <div className="mx-auto w-full max-w-[480px] flex-1 px-4 py-6">
      <h1 className="text-xl font-bold">
        {isPaid
          ? "결제 완료"
          : isCash
            ? "매장 현금 결제 대기"
            : "입금 확인 대기"}
      </h1>
      <p
        className={`mt-2 rounded-lg px-3 py-2 text-sm font-medium ${
          isPaid
            ? "bg-emerald-50 text-emerald-900"
            : "bg-amber-50 text-amber-900"
        }`}
      >
        {statusLabel}
      </p>
      <p className="mt-4 text-sm">
        {order.productName} — {order.amount.toLocaleString()}₫
        {order.paymentMethod ? (
          <span className="text-muted-foreground">
            {" "}
            · {paymentMethodLabel(order.paymentMethod)}
          </span>
        ) : null}
      </p>
      <p className="mt-2 text-sm text-muted-foreground">
        {isPaid
          ? `쿠폰이 ${COUPON_WALLET_SHORT}에 발급되었습니다. QR로 매장에서 사용하세요.`
          : isCash
            ? "매장에서 현금 결제 후 사장님이 확인하면 쿠폰이 발급됩니다."
            : isPendingReview
              ? "입금 확인 요청이 접수되었습니다. 관리자 승인 후 쿠폰이 발급됩니다."
              : "아직 입금 확인 요청이 접수되지 않았습니다. 결제 페이지에서 입금 완료를 눌러 주세요."}
      </p>
      {isPaid ? (
        <Link
          href={`${base}/wallet`}
          className="mt-6 flex min-h-11 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground"
        >
          {COUPON_WALLET_SHORT}에서 QR 사용
        </Link>
      ) : (
        <>
          {!isPendingReview && !isCash ? (
            <Link
              href={`${base}/checkout/${orderId}`}
              className="mt-6 flex min-h-11 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground"
            >
              결제 페이지로
            </Link>
          ) : (
            <Link
              href={`${base}/wallet`}
              className="mt-6 flex min-h-11 items-center justify-center rounded-lg border border-border-light bg-surface text-sm font-semibold"
            >
              {COUPON_WALLET_SHORT} 확인
            </Link>
          )}
        </>
      )}
    </div>
  );
}
