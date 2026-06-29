import Link from "next/link";
import { notFound } from "next/navigation";
import { couponServerFetch } from "@/lib/coupon/server-api";
import { agencyLoginIdForStore, isCouponStore, storeCouponBase } from "@/lib/coupon/config";
import { COUPON_WALLET_SHORT } from "@/lib/coupon/labels";
import { ZaloShareButton } from "@/components/coupon/zalo-share-button";
import type { ProductDto } from "@/lib/coupon/types";

export default async function StoreCouponPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!isCouponStore(slug)) notFound();

  const agency = agencyLoginIdForStore(slug);
  const products = await couponServerFetch<ProductDto[]>(
    agency ? `/products?agency=${encodeURIComponent(agency)}` : "/products",
  );
  const base = storeCouponBase(slug);

  return (
    <div className="mx-auto w-full max-w-[480px] flex-1 px-4 py-6">
      <Link
        href={`/store/${slug}`}
        className="text-sm text-muted-foreground hover:text-primary"
      >
        ← 업소 페이지
      </Link>
      <h1 className="mt-3 text-xl font-bold">쿠폰 구매</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        업소 계좌 QR 또는 매장 현금 결제 후 QR로 사용
      </p>
      <div className="mt-3">
        <ZaloShareButton slug={slug} />
      </div>
      <div className="mt-4 space-y-3">
        {products.map((p) => (
          <div
            key={p.id}
            className="rounded-xl border border-border-light bg-surface p-4"
          >
            <h2 className="font-semibold">{p.name}</h2>
            {p.description ? (
              <p className="mt-1 text-sm text-muted-foreground">{p.description}</p>
            ) : null}
            <p className="mt-2 text-lg font-bold text-primary">
              {p.price.toLocaleString()}₫
            </p>
            <Link
              href={`${base}/${p.id}`}
              className="mt-3 inline-flex min-h-10 w-full items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground"
            >
              구매하기
            </Link>
          </div>
        ))}
      </div>
      <Link
        href={`${base}/wallet`}
        className="mt-6 block text-center text-sm font-medium text-primary hover:underline"
      >
        내 {COUPON_WALLET_SHORT} →
      </Link>
      <p className="mt-2 text-center text-xs text-muted-foreground">
        구매·{COUPON_WALLET_SHORT} 이용 시 호케이 로그인이 필요합니다
      </p>
      <p className="mt-1 text-center text-xs">
        <Link href={`${base}/terms`} className="text-muted-foreground hover:text-primary">
          이용 안내 · 약관
        </Link>
      </p>
    </div>
  );
}
