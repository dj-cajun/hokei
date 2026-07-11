import type { CouponAuditAction, Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { CouponApiError } from "./errors";

export async function logCouponAudit(
  agencyId: string,
  action: CouponAuditAction,
  staffId?: string | null,
  metadata?: Record<string, unknown>,
) {
  await prisma.couponAuditLog.create({
    data: {
      agencyId,
      staffId: staffId ?? null,
      action,
      metadata: (metadata ?? undefined) as Prisma.InputJsonValue | undefined,
    },
  });
}

export async function assertStaffIfRequired(
  agencyId: string,
  staffId?: string | null,
) {
  const count = await prisma.couponAgencyStaff.count({
    where: { agencyId, isActive: true },
  });
  if (count === 0) return;
  if (!staffId) {
    throw new CouponApiError(403, "STAFF_REQUIRED", "직원 PIN 로그인이 필요합니다.");
  }
}
