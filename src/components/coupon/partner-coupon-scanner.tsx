"use client";

import { Html5QrcodeScanner } from "html5-qrcode";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { couponFetch } from "@/lib/coupon/api";
import { PARTNER_COUPON_BASE } from "@/lib/coupon/config";
import type { ScanResponse } from "@/lib/coupon/types";
import { usePartnerCouponAuth } from "@/components/coupon/use-partner-coupon-auth";

export function PartnerCouponScanner() {
  const { state } = usePartnerCouponAuth();
  const processing = useRef(false);
  const [result, setResult] = useState<ScanResponse | null>(null);
  const [scanning, setScanning] = useState(true);

  useEffect(() => {
    if (state.status !== "ready") return;

    const scanner = new Html5QrcodeScanner(
      "partner-qr-reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      false,
    );

    scanner.render(
      async (decodedText) => {
        if (processing.current) return;
        processing.current = true;
        await scanner.clear().catch(() => undefined);
        setScanning(false);
        try {
          const res = await couponFetch<ScanResponse>("/redemptions/scan", {
            method: "POST",
            body: JSON.stringify({ qrPayload: decodedText }),
            agency: true,
          });
          setResult(res);
        } catch (e) {
          setResult({
            success: false,
            code: "INVALID_TOKEN",
            message: e instanceof Error ? e.message : "스캔 실패",
          });
        }
      },
      () => undefined,
    );

    return () => {
      scanner.clear().catch(() => undefined);
    };
  }, [scanning, state.status]);

  if (state.status === "loading") {
    return <p className="text-sm text-muted-foreground">쿠폰 계정 연결 중...</p>;
  }

  if (state.status === "needs_login") {
    return null;
  }

  function reset() {
    setResult(null);
    processing.current = false;
    setScanning(true);
  }

  if (result?.success) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-8 text-center">
        <p className="text-4xl">✅</p>
        <h2 className="mt-3 text-xl font-bold">{result.productName}</h2>
        <p className="mt-1 text-emerald-800">교환 완료</p>
        {result.productPrice != null ? (
          <p className="mt-2 text-sm text-emerald-900">
            메뉴 {result.productPrice.toLocaleString()}₫ (매장 직수금)
          </p>
        ) : null}
        <p className="mt-2 text-lg font-bold">
          플랫폼 수수료 +{result.amount.toLocaleString()}₫
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-6 min-h-11 w-full rounded-lg bg-primary text-sm font-bold text-primary-foreground"
        >
          다음 스캔
        </button>
      </div>
    );
  }

  if (result && !result.success) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center">
        <p className="text-4xl">❌</p>
        <h2 className="mt-3 text-lg font-bold text-red-900">{result.message}</h2>
        <p className="mt-1 text-xs text-red-700">{result.code}</p>
        <button
          type="button"
          onClick={reset}
          className="mt-6 min-h-11 w-full rounded-lg bg-primary text-sm font-bold text-primary-foreground"
        >
          다시 스캔
        </button>
      </div>
    );
  }

  return (
    <div>
      <p className="mb-4 text-sm text-muted-foreground">
        손님 QR을 프레임 안에 맞춰주세요
      </p>
      <div className="overflow-hidden rounded-xl border border-border-light">
        <div id="partner-qr-reader" />
      </div>
      <Link
        href={PARTNER_COUPON_BASE}
        className="mt-4 block text-center text-sm text-muted-foreground hover:text-primary"
      >
        ← 쿠폰 관리
      </Link>
    </div>
  );
}
