import Link from "next/link";
import { ArrowLeft, QrCode, BarChart3, List, Banknote, MessageCircle, ClipboardList, Monitor, KeyRound } from "lucide-react";
import { requireAuth } from "@/lib/auth-utils";
import { PARTNER_COUPON_BASE } from "@/lib/coupon/config";
import { PartnerCouponMessagesPanel } from "@/components/coupon/partner-coupon-messages-panel";

export const dynamic = "force-dynamic";

export default async function PartnerCouponHubPage() {
  await requireAuth();

  const links = [
    { href: `${PARTNER_COUPON_BASE}/scan`, label: "QR 스캐너", icon: QrCode },
    { href: `${PARTNER_COUPON_BASE}/kiosk`, label: "키오스크 모드", icon: Monitor },
    { href: `${PARTNER_COUPON_BASE}/pos`, label: "POS 연동", icon: KeyRound },
    { href: `${PARTNER_COUPON_BASE}/orders`, label: "현금 결제", icon: Banknote },
    { href: `${PARTNER_COUPON_BASE}/dashboard`, label: "수수료 대시보드", icon: BarChart3 },
    { href: `${PARTNER_COUPON_BASE}/transactions`, label: "교환 이력", icon: List },
    { href: `${PARTNER_COUPON_BASE}/close-day`, label: "일 마감", icon: ClipboardList },
    { href: "/messages", label: "쿠폰 문의 (쪽지함)", icon: MessageCircle },
  ];

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">
      <Link
        href="/account/partner"
        className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        제휴 업소 관리
      </Link>
      <div className="rounded-2xl bg-surface p-6 md:p-8">
        <h1 className="text-xl font-bold">2D SKETCH CAFE · 쿠폰</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          QR 스캔, 수수료·교환 확인 (호케이 계정으로 자동 연동)
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex min-h-24 flex-col items-center justify-center gap-2 rounded-xl border border-border-light bg-secondary p-4 text-sm font-semibold hover:bg-card-hover"
            >
              <Icon className="h-6 w-6 text-primary" />
              {label}
            </Link>
          ))}
        </div>
        <div className="mt-8 border-t border-border-light pt-6">
          <h2 className="text-sm font-bold">쿠폰 고객 문의</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            결제 완료 시 고객과 자동으로 열리는 대화 · 미읽음 표시
          </p>
          <div className="mt-4">
            <PartnerCouponMessagesPanel />
          </div>
        </div>
        <Link
          href={`${PARTNER_COUPON_BASE}/login`}
          className="mt-6 block text-center text-sm text-muted-foreground hover:text-primary"
        >
          별도 스캔 계정으로 로그인 (데모·대리)
        </Link>
      </div>
    </div>
  );
}
