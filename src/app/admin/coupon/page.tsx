import type { Metadata } from "next";
import { AdminCouponPendingPanel } from "@/components/coupon/admin-coupon-pending-panel";
import { AdminCouponFeesPanel } from "@/components/coupon/admin-coupon-fees-panel";
import { requireAdmin } from "@/lib/auth-utils";

export const metadata: Metadata = {
  title: "쿠폰 입금 승인 - 호케이 Admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminCouponPage() {
  await requireAdmin();

  return (
    <div>
      <h1 className="text-xl font-bold">O2O 쿠폰 · 입금 승인</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        2D SKETCH CAFE 등 — 수동 입금 확인 후 쿠폰 발급
      </p>
      <div className="mt-6">
        <AdminCouponPendingPanel />
      </div>
      <div className="mt-10 border-t border-border-light pt-8">
        <h2 className="text-lg font-bold">주간 수수료 리포트</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          교환(redemption) 1건 = 플랫폼 수수료 1건 · 업소별 납부 예정액
        </p>
        <div className="mt-4">
          <AdminCouponFeesPanel />
        </div>
      </div>
    </div>
  );
}
