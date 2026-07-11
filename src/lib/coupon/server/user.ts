import { prisma } from "@/lib/prisma";
import { CouponApiError } from "./errors";

export async function resolveCouponUserId(
  userIdHeader?: string,
): Promise<string> {
  if (userIdHeader?.trim()) {
    const existing = await prisma.user.findUnique({
      where: { id: userIdHeader.trim() },
    });
    if (existing) return existing.id;
    throw new CouponApiError(401, "UNAUTHORIZED", "X-User-Id header required");
  }

  if (process.env.ALLOW_DEMO_BUYER === "true") {
    const demo = await prisma.user.findFirst({
      where: { email: "buyer@example.com" },
    });
    if (!demo) {
      throw new CouponApiError(
        404,
        "NOT_FOUND",
        "Demo buyer not found. Run coupon:seed",
      );
    }
    return demo.id;
  }

  throw new CouponApiError(401, "UNAUTHORIZED", "X-User-Id header required");
}
