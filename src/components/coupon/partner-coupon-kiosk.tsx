"use client";

import { Html5QrcodeScanner } from "html5-qrcode";
import { useEffect, useRef, useState } from "react";
import { couponFetch } from "@/lib/coupon/api";
import type { ScanResponse } from "@/lib/coupon/types";
import { usePartnerCouponAuth } from "@/components/coupon/use-partner-coupon-auth";

type Mode = "camera" | "wedge";

export function PartnerCouponKiosk() {
  const { state } = usePartnerCouponAuth();
  const processing = useRef(false);
  const wedgeRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<Mode>("camera");
  const [result, setResult] = useState<ScanResponse | null>(null);
  const [scanning, setScanning] = useState(true);

  async function handleScan(qrPayload: string) {
    if (processing.current) return;
    processing.current = true;
    try {
      const res = await couponFetch<ScanResponse>("/redemptions/scan", {
        method: "POST",
        body: JSON.stringify({ qrPayload: qrPayload.trim() }),
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
  }

  useEffect(() => {
    if (state.status !== "ready" || mode !== "camera" || !scanning) return;

    const scanner = new Html5QrcodeScanner(
      "kiosk-qr-reader",
      { fps: 12, qrbox: { width: 280, height: 280 } },
      false,
    );

    scanner.render(
      async (decodedText) => {
        await scanner.clear().catch(() => undefined);
        setScanning(false);
        await handleScan(decodedText);
      },
      () => undefined,
    );

    return () => {
      scanner.clear().catch(() => undefined);
    };
  }, [scanning, state.status, mode]);

  useEffect(() => {
    if (mode === "wedge" && wedgeRef.current) {
      wedgeRef.current.focus();
    }
  }, [mode, scanning]);

  function reset() {
    setResult(null);
    processing.current = false;
    setScanning(true);
    if (mode === "wedge" && wedgeRef.current) {
      wedgeRef.current.value = "";
      wedgeRef.current.focus();
    }
  }

  if (state.status === "loading") {
    return (
      <p className="py-20 text-center text-lg text-white/70">쿠폰 계정 연결 중...</p>
    );
  }

  if (state.status === "needs_login") {
    return null;
  }

  if (result?.success) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
        <p className="text-6xl">✅</p>
        <h2 className="mt-4 text-3xl font-bold">{result.productName}</h2>
        <p className="mt-2 text-xl text-emerald-300">교환 완료</p>
        <button
          type="button"
          onClick={reset}
          className="mt-10 min-h-14 w-full max-w-sm rounded-2xl bg-white text-lg font-bold text-black"
        >
          다음 손님
        </button>
      </div>
    );
  }

  if (result && !result.success) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
        <p className="text-6xl">❌</p>
        <h2 className="mt-4 text-2xl font-bold text-red-300">{result.message}</h2>
        <button
          type="button"
          onClick={reset}
          className="mt-10 min-h-14 w-full max-w-sm rounded-2xl bg-white text-lg font-bold text-black"
        >
          다시 스캔
        </button>
      </div>
    );
  }

  return (
    <div className="px-4 py-6">
      <div className="mb-4 flex justify-center gap-2">
        <button
          type="button"
          onClick={() => {
            setMode("camera");
            reset();
          }}
          className={`rounded-full px-4 py-2 text-sm font-semibold ${
            mode === "camera" ? "bg-white text-black" : "bg-white/15 text-white"
          }`}
        >
          카메라
        </button>
        <button
          type="button"
          onClick={() => {
            setMode("wedge");
            reset();
          }}
          className={`rounded-full px-4 py-2 text-sm font-semibold ${
            mode === "wedge" ? "bg-white text-black" : "bg-white/15 text-white"
          }`}
        >
          POS 스캐너
        </button>
      </div>

      {mode === "camera" ? (
        <div className="overflow-hidden rounded-2xl border border-white/20">
          <div id="kiosk-qr-reader" />
        </div>
      ) : (
        <form
          className="mx-auto max-w-md"
          onSubmit={(e) => {
            e.preventDefault();
            const val = wedgeRef.current?.value ?? "";
            if (val.trim()) void handleScan(val);
          }}
        >
          <label className="block text-sm text-white/70">스캐너 입력 (Enter)</label>
          <input
            ref={wedgeRef}
            type="text"
            autoComplete="off"
            className="mt-2 w-full rounded-xl border border-white/30 bg-black px-4 py-4 text-lg text-white outline-none focus:border-white"
            placeholder="QR 데이터"
          />
          <button
            type="submit"
            className="mt-4 min-h-12 w-full rounded-xl bg-white font-bold text-black"
          >
            확인
          </button>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-white/50">손님 쿠폰 QR을 스캔하세요</p>
    </div>
  );
}
