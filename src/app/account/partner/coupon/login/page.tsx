import type { Metadata } from "next";
import { PartnerCouponLoginForm } from "@/components/coupon/partner-coupon-login-form";

export const metadata: Metadata = {
  title: "쿠폰 스캔 로그인 - 호케이",
  robots: { index: false, follow: false },
};

export default function PartnerCouponLoginPage() {
  return (
    <div className="mx-auto w-full max-w-md flex-1 px-4 py-6">
      <h1 className="text-xl font-bold">쿠폰 스캔 로그인</h1>
      <p className="mt-1 text-sm text-muted-foreground">2D SKETCH CAFE 대리점</p>
      <div className="mt-6 rounded-2xl border border-border-light bg-surface p-6">
        <PartnerCouponLoginForm />
      </div>
    </div>
  );
}
