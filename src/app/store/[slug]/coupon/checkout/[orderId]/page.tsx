import { notFound } from "next/navigation";
import { requireAuthWithCallback } from "@/lib/auth-utils";
import { isCouponStore, storeCouponBase } from "@/lib/coupon/config";
import { CouponCheckoutClient } from "./checkout-client";

type PageProps = {
  params: Promise<{ slug: string; orderId: string }>;
};

export default async function CouponCheckoutPage({ params }: PageProps) {
  const { slug, orderId } = await params;
  if (!isCouponStore(slug)) notFound();

  await requireAuthWithCallback(`${storeCouponBase(slug)}/checkout/${orderId}`);
  return <CouponCheckoutClient slug={slug} orderId={orderId} />;
}
