import {
  CouponAuditAction,
  CouponWalletStatus,
  Prisma,
} from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { assertStaffIfRequired, logCouponAudit } from "./audit";
import { platformFeeAmount } from "./common/platform-fee";
import { CouponApiError } from "./errors";
import {
  extractTokenFromQrPayload,
  newRedemptionJti,
  redemptionTtlSec,
  signRedemptionToken,
  verifyRedemptionToken,
} from "./redemption-token-signer";

export async function issueRedemptionToken(
  walletItemId: string,
  userId: string,
  refresh = false,
) {
  return prisma.$transaction(async (tx) => {
    const walletItem = await tx.couponWalletItem.findUnique({
      where: { id: walletItemId },
      include: { product: true },
    });

    if (!walletItem || walletItem.userId !== userId) {
      throw new CouponApiError(404, "NOT_FOUND", "Coupon not found");
    }

    if (walletItem.status !== CouponWalletStatus.issued) {
      throw new CouponApiError(400, "COUPON_NOT_REDEEMABLE", "사용할 수 없는 쿠폰입니다.");
    }

    if (walletItem.expiresAt && walletItem.expiresAt < new Date()) {
      throw new CouponApiError(400, "COUPON_EXPIRED", "쿠폰 유효기간이 만료되었습니다.");
    }

    const now = new Date();
    await tx.couponRedemptionToken.updateMany({
      where: {
        walletItemId,
        revokedAt: null,
        usedAt: null,
        expiresAt: { gt: now },
      },
      data: { revokedAt: now },
    });

    const jti = newRedemptionJti();
    const { token, qrPayload, expiresAt } = await signRedemptionToken(
      jti,
      walletItemId,
    );

    await tx.couponRedemptionToken.create({
      data: {
        jti,
        walletItemId,
        userId,
        expiresAt,
      },
    });

    return {
      token,
      qrPayload,
      expiresAt: expiresAt.toISOString(),
      serverTime: new Date().toISOString(),
      ttlSec: redemptionTtlSec(),
      refreshed: refresh,
    };
  });
}

type ScanFailure = {
  success: false;
  code: string;
  message: string;
};

type ScanSuccess = {
  success: true;
  productName: string;
  amount: number;
  productPrice: number;
  currency: string;
  redeemedAt: string;
};

export async function scanRedemption(
  qrPayload: string,
  agencyId: string,
  staffId?: string | null,
  pos?: { posDeviceId: string; posDeviceName: string },
): Promise<ScanFailure | ScanSuccess> {
  if (!pos?.posDeviceId) {
    await assertStaffIfRequired(agencyId, staffId);
  }

  let jwtPayload;
  try {
    const rawToken = extractTokenFromQrPayload(qrPayload);
    jwtPayload = await verifyRedemptionToken(rawToken, {
      ignoreExpiration: true,
    });
  } catch {
    return {
      success: false,
      code: "INVALID_TOKEN",
      message: "유효하지 않은 QR입니다.",
    };
  }

  const now = new Date();
  if (jwtPayload.exp * 1000 < now.getTime()) {
    return {
      success: false,
      code: "TOKEN_EXPIRED",
      message: "QR이 만료되었습니다. 손님에게 재발급을 요청하세요.",
    };
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const tokens = await tx.$queryRaw<
        Array<{
          id: string;
          jti: string;
          wallet_item_id: string;
          revoked_at: Date | null;
          used_at: Date | null;
          expires_at: Date;
        }>
      >(
        Prisma.sql`SELECT id, jti, wallet_item_id, revoked_at, used_at, expires_at
          FROM coupon_redemption_tokens WHERE jti = ${jwtPayload.jti} FOR UPDATE`,
      );

      const tokenRow = tokens[0];
      if (!tokenRow) {
        return {
          success: false as const,
          code: "INVALID_TOKEN" as const,
          message: "유효하지 않은 QR입니다.",
        };
      }

      if (tokenRow.revoked_at) {
        return {
          success: false as const,
          code: "INVALID_TOKEN" as const,
          message: "무효화된 QR입니다. 재발급을 요청하세요.",
        };
      }

      if (tokenRow.used_at) {
        return {
          success: false as const,
          code: "ALREADY_USED" as const,
          message: "이미 사용된 쿠폰입니다.",
        };
      }

      if (tokenRow.expires_at < now) {
        return {
          success: false as const,
          code: "TOKEN_EXPIRED" as const,
          message: "QR이 만료되었습니다. 손님에게 재발급을 요청하세요.",
        };
      }

      const walletItems = await tx.$queryRaw<
        Array<{
          id: string;
          status: string;
          product_id: string;
          agency_id: string;
        }>
      >(
        Prisma.sql`SELECT c.id, c.status, c.product_id, p.agency_id
          FROM coupon_wallet_items c
          JOIN coupon_products p ON p.id = c.product_id
          WHERE c.id = ${tokenRow.wallet_item_id} FOR UPDATE`,
      );

      const walletRow = walletItems[0];
      if (!walletRow || walletRow.status !== CouponWalletStatus.issued) {
        return {
          success: false as const,
          code: "ALREADY_USED" as const,
          message: "이미 사용된 쿠폰입니다.",
        };
      }

      if (walletRow.agency_id !== agencyId) {
        throw new CouponApiError(
          403,
          "WRONG_AGENCY",
          "다른 매장의 쿠폰입니다.",
          { success: false, code: "WRONG_AGENCY", message: "다른 매장의 쿠폰입니다." },
        );
      }

      const product = await tx.couponProduct.findUniqueOrThrow({
        where: { id: walletRow.product_id },
      });

      const agency = await tx.couponAgency.findUniqueOrThrow({
        where: { id: agencyId },
      });
      const platformFee = platformFeeAmount(agency, product.price);

      const redeemedAt = new Date();

      await tx.couponRedemptionToken.update({
        where: { id: tokenRow.id },
        data: { usedAt: redeemedAt, usedByAgencyId: agencyId },
      });

      await tx.couponWalletItem.update({
        where: { id: walletRow.id },
        data: { status: CouponWalletStatus.redeemed, redeemedAt },
      });

      await tx.couponPlatformTxn.create({
        data: {
          agencyId,
          walletItemId: walletRow.id,
          amount: platformFee,
          productPrice: product.price,
          productName: product.name,
          occurredAt: redeemedAt,
        },
      });

      await tx.couponAgency.update({
        where: { id: agencyId },
        data: { balance: { increment: platformFee } },
      });

      return {
        success: true as const,
        productName: product.name,
        amount: platformFee,
        productPrice: Number(product.price),
        currency: "VND",
        redeemedAt: redeemedAt.toISOString(),
      };
    });

    if (result.success) {
      await logCouponAudit(agencyId, CouponAuditAction.redeemed, staffId, {
        productName: result.productName,
        platformFee: result.amount,
        posDeviceId: pos?.posDeviceId,
        posDeviceName: pos?.posDeviceName,
      });
    }

    return result;
  } catch (err) {
    if (err instanceof CouponApiError && err.code === "WRONG_AGENCY") {
      return err.details as ScanFailure;
    }
    throw err;
  }
}
