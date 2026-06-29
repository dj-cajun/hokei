import { notFound } from "next/navigation";
import { requireAuthWithCallback } from "@/lib/auth-utils";
import { isCouponStore, storeCouponBase } from "@/lib/coupon/config";
import { CouponRedeemClient } from "./redeem-client";

type PageProps = {
  params: Promise<{ slug: string; id: string }>;
};

export default async function CouponRedeemPage({ params }: PageProps) {
  const { slug, id } = await params;
  if (!isCouponStore(slug)) notFound();

  await requireAuthWithCallback(`${storeCouponBase(slug)}/wallet/${id}/redeem`);
  return <CouponRedeemClient slug={slug} couponId={id} />;
}
