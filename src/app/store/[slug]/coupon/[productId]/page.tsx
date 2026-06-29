import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAuthWithCallback } from "@/lib/auth-utils";
import { CouponBuyButton } from "@/components/coupon/coupon-buy-button";
import { couponServerFetch } from "@/lib/coupon/server-api";
import { agencyLoginIdForStore, isCouponStore, storeCouponBase } from "@/lib/coupon/config";
import { isProductForStore } from "@/lib/coupon/store-products";
import type { ProductDto } from "@/lib/coupon/types";

export default async function StoreCouponProductPage({
  params,
}: {
  params: Promise<{ slug: string; productId: string }>;
}) {
  const { slug, productId } = await params;
  if (!isCouponStore(slug)) notFound();

  await requireAuthWithCallback(`${storeCouponBase(slug)}/${productId}`);

  let product: ProductDto;
  try {
    product = await couponServerFetch<ProductDto>(`/products/${productId}`);
  } catch {
    notFound();
  }

  if (!isProductForStore(product, slug)) notFound();

  return (
    <div className="mx-auto w-full max-w-[480px] flex-1 px-4 py-6">
      <Link
        href={`/store/${slug}/coupon`}
        className="text-sm text-muted-foreground hover:text-primary"
      >
        ← 메뉴
      </Link>
      <div className="mt-4">
        <CouponBuyButton slug={slug} productId={productId} product={product} />
      </div>
    </div>
  );
}
