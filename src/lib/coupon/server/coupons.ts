import { prisma } from "@/lib/prisma";
import { CouponApiError } from "./errors";
import { issueRedemptionToken } from "./redemptions";

export async function listCouponsByUser(
  userId: string,
  agencyLoginId?: string,
) {
  const coupons = await prisma.couponWalletItem.findMany({
    where: {
      userId,
      ...(agencyLoginId
        ? { product: { agency: { loginId: agencyLoginId } } }
        : {}),
    },
    include: { product: { include: { agency: true } } },
    orderBy: { createdAt: "desc" },
  });

  return coupons.map((c) => ({
    id: c.id,
    status: c.status,
    productName: c.product.name,
    productId: c.productId,
    orderId: c.orderId,
    issuedAt: c.issuedAt.toISOString(),
    redeemedAt: c.redeemedAt?.toISOString() ?? null,
  }));
}

export async function getCouponById(couponId: string, userId: string) {
  const coupon = await prisma.couponWalletItem.findFirst({
    where: { id: couponId, userId },
    include: { product: { include: { agency: true } } },
  });
  if (!coupon) {
    throw new CouponApiError(404, "NOT_FOUND", "Coupon not found");
  }
  return coupon;
}

export async function getCouponSummary(couponId: string, userId: string) {
  const coupon = await getCouponById(couponId, userId);
  return {
    id: coupon.id,
    status: coupon.status,
    productName: coupon.product.name,
    agencyName: coupon.product.agency.name,
  };
}

export function issueToken(couponId: string, userId: string) {
  return issueRedemptionToken(couponId, userId, false);
}

export function refreshToken(couponId: string, userId: string) {
  return issueRedemptionToken(couponId, userId, true);
}

export async function issueWalletItemFromOrder(orderId: string) {
  const order = await prisma.couponOrder.findUnique({
    where: { id: orderId },
    include: { walletItem: true },
  });
  if (!order || order.status !== "paid") {
    throw new CouponApiError(404, "NOT_FOUND", "Paid order not found");
  }
  if (order.walletItem) {
    return order.walletItem;
  }
  return prisma.couponWalletItem.create({
    data: {
      userId: order.userId,
      productId: order.productId,
      orderId: order.id,
      status: "issued",
    },
  });
}
