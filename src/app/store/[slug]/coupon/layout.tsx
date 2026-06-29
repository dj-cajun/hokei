import type { Metadata } from "next";
import { couponStoreLabel, isCouponStore } from "@/lib/coupon/config";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.hokei.vn";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  if (!isCouponStore(slug)) return {};

  const label = couponStoreLabel(slug) ?? slug;
  const title = `${label} · 쿠폰 구매`;
  const url = `${siteUrl.replace(/\/$/, "")}/store/${slug}/coupon`;

  return {
    title,
    description: `${label} 메뉴 쿠폰 — 업소 계좌 QR 또는 매장 현금 결제`,
    openGraph: {
      title,
      description: `${label}에서 쿠폰을 구매하고 QR로 사용하세요.`,
      url,
      type: "website",
      siteName: "Hokei",
    },
  };
}

export default function StoreCouponLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
