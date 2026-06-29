"use client";

import { QRCodeSVG } from "qrcode.react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { couponFetch } from "@/lib/coupon/api";
import { COUPON_WALLET_SHORT } from "@/lib/coupon/labels";
import type { RedemptionTokenResponse } from "@/lib/coupon/types";

function formatTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

type Props = {
  slug: string;
  couponId: string;
};

export function CouponRedeemClient({ slug, couponId }: Props) {
  const [data, setData] = useState<RedemptionTokenResponse | null>(null);
  const [remaining, setRemaining] = useState(0);
  const [productName, setProductName] = useState("");
  const [loading, setLoading] = useState(false);
  const base = storeCouponBase(slug);

  const loadToken = useCallback(
    async (refresh = false) => {
      setLoading(true);
      try {
        const path = refresh
          ? `/coupons/${couponId}/redemption-token/refresh`
          : `/coupons/${couponId}/redemption-token`;
        const res = await couponFetch<RedemptionTokenResponse>(path, {
          method: "POST",
        });
        setData(res);
        const expires = new Date(res.expiresAt).getTime();
        const now = new Date(res.serverTime).getTime();
        setRemaining(Math.max(0, Math.floor((expires - now) / 1000)));
      } catch (e) {
        alert(e instanceof Error ? e.message : "QR 발급 실패");
      } finally {
        setLoading(false);
      }
    },
    [couponId],
  );

  useEffect(() => {
    couponFetch<{ productName: string }>(`/coupons/${couponId}`).then((c) =>
      setProductName(c.productName),
    );
    loadToken(false);
  }, [couponId, loadToken]);

  useEffect(() => {
    if (remaining <= 0) return;
    const t = setInterval(() => setRemaining((r) => Math.max(0, r - 1)), 1000);
    return () => clearInterval(t);
  }, [remaining, data]);

  const expired = remaining <= 0;

  return (
    <div className="mx-auto w-full max-w-[480px] flex-1 px-4 py-6 text-center">
      <Link href={`${base}/wallet`} className="text-sm text-muted-foreground hover:text-primary">
        ← {COUPON_WALLET_SHORT}
      </Link>
      <h1 className="mt-3 text-xl font-bold">{productName || "쿠폰 사용"}</h1>
      <p className="mt-1 text-sm text-muted-foreground">매장에서 QR을 보여주세요</p>
      {data ? (
        <div className="my-6 flex flex-col items-center gap-4">
          <div className={expired ? "opacity-25" : ""}>
            <QRCodeSVG value={data.qrPayload} size={220} />
          </div>
          <p
            className={`text-3xl font-bold tabular-nums ${remaining <= 30 && remaining > 0 ? "text-destructive" : ""}`}
          >
            ⏱ {formatTime(remaining)}
          </p>
        </div>
      ) : null}
      {expired ? (
        <p className="text-sm text-destructive">QR이 만료되었습니다. 재발급해 주세요.</p>
      ) : null}
      <button
        type="button"
        onClick={() => loadToken(true)}
        disabled={loading}
        className="mt-4 flex min-h-11 w-full items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground disabled:opacity-50"
      >
        {loading ? "발급 중..." : "QR 재발급"}
      </button>
    </div>
  );
}
