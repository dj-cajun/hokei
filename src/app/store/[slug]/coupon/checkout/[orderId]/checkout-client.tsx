"use client";

import { QRCodeSVG } from "qrcode.react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { couponFetch } from "@/lib/coupon/api";
import { COUPON_WALLET_SHORT } from "@/lib/coupon/labels";
import { storeCouponBase } from "@/lib/coupon/config";
import type { OrderDto, PaymentQrInfo } from "@/lib/coupon/types";

type Props = {
  slug: string;
  orderId: string;
};

export function CouponCheckoutClient({ slug, orderId }: Props) {
  const router = useRouter();
  const [order, setOrder] = useState<OrderDto | null>(null);
  const [info, setInfo] = useState<PaymentQrInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const base = storeCouponBase(slug);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const o = await couponFetch<OrderDto>(`/orders/${orderId}`);
        if (cancelled) return;
        setOrder(o);

        if (o.status === "payment_pending_review") {
          router.replace(`${base}/orders/${orderId}/pending`);
          return;
        }
        if (o.status === "paid") {
          router.replace(`${base}/wallet`);
          return;
        }

        if (o.paymentMethod === "cash_at_store") {
          return;
        }

        const qr = await couponFetch<PaymentQrInfo>(`/orders/${orderId}/payment-qr`);
        if (!cancelled) setInfo(qr);
      } catch {
        if (!cancelled) {
          setOrder(null);
          setInfo(null);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [orderId, base, router]);

  useEffect(() => {
    if (!info?.autoApproveEnabled) return;

    const interval = setInterval(async () => {
      try {
        const o = await couponFetch<OrderDto>(`/orders/${orderId}`);
        if (o.status === "paid") {
          router.replace(`${base}/wallet`);
        }
      } catch {
        /* ignore poll errors */
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [info?.autoApproveEnabled, orderId, base, router]);

  async function confirmDeposit() {
    setLoading(true);
    try {
      await couponFetch(`/orders/${orderId}/confirm-deposit`, { method: "POST" });
      router.push(`${base}/orders/${orderId}/pending`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "요청 실패";
      if (msg.toLowerCase().includes("not found")) {
        router.push(`${base}/orders/${orderId}/pending`);
        return;
      }
      alert(msg);
    } finally {
      setLoading(false);
    }
  }

  if (!order) {
    return (
      <div className="mx-auto max-w-[480px] px-4 py-6 text-sm text-muted-foreground">
        로딩 중...
      </div>
    );
  }

  if (order.paymentMethod === "cash_at_store") {
    return (
      <div className="mx-auto w-full max-w-[480px] flex-1 px-4 py-6">
        <h1 className="text-xl font-bold">매장 현금 결제</h1>
        <p className="mt-2 text-sm">
          <strong>{order.productName}</strong> ·{" "}
          <strong>{order.amount.toLocaleString()}₫</strong>
        </p>
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          <p>매장에서 현금으로 결제해 주세요.</p>
          <p className="mt-2">
            사장님이 결제를 확인하면 {COUPON_WALLET_SHORT}에 쿠폰이 발급됩니다.
          </p>
        </div>
        <Link
          href={`/store/${slug}`}
          className="mt-6 flex min-h-11 w-full items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground"
        >
          매장 위치 보기
        </Link>
        <Link
          href={`${base}/wallet`}
          className="mt-3 block text-center text-sm text-muted-foreground hover:text-primary"
        >
          {COUPON_WALLET_SHORT} 확인
        </Link>
      </div>
    );
  }

  if (!info) {
    return (
      <div className="mx-auto max-w-[480px] px-4 py-6 text-sm text-muted-foreground">
        로딩 중...
      </div>
    );
  }

  const qrValue = `bank://${info.bankAccount}?amount=${info.amount}&note=${info.transferNote}`;

  return (
    <div className="mx-auto w-full max-w-[480px] flex-1 px-4 py-6">
      <h1 className="text-xl font-bold">결제하기</h1>
      <p className="mt-2 text-sm">
        <strong>{info.amount.toLocaleString()}₫</strong>을 아래 <strong>업소(대리점)</strong>{" "}
        계좌로 송금해 주세요.
      </p>
      {info.agencyName ? (
        <p className="mt-1 text-xs text-muted-foreground">업소: {info.agencyName}</p>
      ) : null}
      {info.autoApproveEnabled ? (
        <p className="mt-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-900">
          VietQR 자동 입금 확인이 켜져 있습니다. 송금 후 잠시만 기다리면 {COUPON_WALLET_SHORT}
          으로 이동합니다. 입금자명은 <strong>{info.transferNote}</strong> 그대로 입력해 주세요.
        </p>
      ) : null}
      <div className="my-6 flex justify-center">
        <QRCodeSVG value={qrValue} size={200} />
      </div>
      <div className="space-y-1 text-sm text-muted-foreground">
        <div>은행: {info.bankName}</div>
        <div>계좌: {info.bankAccount}</div>
        <div>예금주: {info.bankHolder}</div>
        <div>입금자명: {info.transferNote}</div>
      </div>
      <button
        type="button"
        onClick={confirmDeposit}
        disabled={loading}
        className="mt-6 flex min-h-11 w-full items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground disabled:opacity-50"
      >
        {loading ? "처리 중..." : "입금 완료"}
      </button>
      <Link
        href={`/store/${slug}/coupon`}
        className="mt-3 block text-center text-sm text-muted-foreground"
      >
        취소
      </Link>
    </div>
  );
}
