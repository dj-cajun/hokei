import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAuthWithCallback } from "@/lib/auth-utils";
import { couponServerFetch } from "@/lib/coupon/server-api";
import { agencyLoginIdForStore, isCouponStore, storeCouponBase } from "@/lib/coupon/config";
import { COUPON_WALLET_TITLE } from "@/lib/coupon/labels";
import { findConversationIdForCouponOrder } from "@/lib/coupon/order-conversation";
import type { CouponDto } from "@/lib/coupon/types";

function badge(status: string) {
  if (status === "issued") return "사용 가능";
  if (status === "redeemed") return "사용 완료";
  return status;
}

async function conversationIdsByOrder(coupons: CouponDto[]) {
  const entries = await Promise.all(
    coupons
      .filter((c) => c.orderId)
      .map(async (c) => {
        const conversationId = await findConversationIdForCouponOrder(c.orderId!);
        return conversationId ? ([c.orderId!, conversationId] as const) : null;
      }),
  );
  return new Map(entries.filter(Boolean) as [string, string][]);
}

export default async function CouponWalletPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!isCouponStore(slug)) notFound();

  const base = storeCouponBase(slug);
  await requireAuthWithCallback(`${base}/wallet`);

  const agency = agencyLoginIdForStore(slug);
  const coupons = await couponServerFetch<CouponDto[]>(
    agency ? `/coupons?agency=${encodeURIComponent(agency)}` : "/coupons",
  );
  const conversationByOrder = await conversationIdsByOrder(coupons);

  return (
    <div className="mx-auto w-full max-w-[480px] flex-1 px-4 py-6">
      <Link
        href={`/store/${slug}/coupon`}
        className="text-sm text-muted-foreground hover:text-primary"
      >
        ← 쿠폰 구매
      </Link>
      <h1 className="mt-3 text-xl font-bold">{COUPON_WALLET_TITLE}</h1>
      {coupons.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">보유 쿠폰이 없습니다.</p>
      ) : null}
      <div className="mt-4 space-y-3">
        {coupons.map((c) => {
          const conversationId = c.orderId
            ? conversationByOrder.get(c.orderId)
            : undefined;

          return (
            <div
              key={c.id}
              className="rounded-xl border border-border-light bg-surface p-4"
            >
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-semibold">{c.productName}</h2>
                <span className="text-xs font-medium text-muted-foreground">
                  {badge(c.status)}
                </span>
              </div>
              {c.status === "issued" ? (
                <Link
                  href={`${base}/wallet/${c.id}/redeem`}
                  className="mt-3 flex min-h-10 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground"
                >
                  QR 사용하기
                </Link>
              ) : null}
              {conversationId ? (
                <Link
                  href={`/messages/${conversationId}`}
                  className="mt-2 flex min-h-9 items-center justify-center rounded-lg border border-border-light text-sm font-medium text-primary hover:bg-secondary"
                >
                  업소와 대화
                </Link>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
