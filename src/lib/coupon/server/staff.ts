import { CouponAuditAction, CouponStaffRole } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { logCouponAudit } from "./audit";
import { getVietnamDayBounds } from "./common/vietnam-day";
import type { CouponStaffContext } from "./context";
import { CouponApiError } from "./errors";
import { signCouponJwt } from "./jwt";

export async function hasActiveStaff(agencyId: string) {
  const count = await prisma.couponAgencyStaff.count({
    where: { agencyId, isActive: true },
  });
  return count > 0;
}

export async function listStaffForAgency(agencyId: string) {
  return prisma.couponAgencyStaff.findMany({
    where: { agencyId, isActive: true },
    orderBy: [{ role: "asc" }, { name: "asc" }],
    select: { id: true, name: true, role: true },
  });
}

export async function verifyStaffPin(
  agencyId: string,
  staffId: string,
  pin: string,
) {
  const staff = await prisma.couponAgencyStaff.findFirst({
    where: { id: staffId, agencyId, isActive: true },
  });
  if (!staff) {
    throw new CouponApiError(404, "NOT_FOUND", "직원을 찾을 수 없습니다.");
  }

  const valid = await bcrypt.compare(pin, staff.pinHash);
  if (!valid) {
    throw new CouponApiError(401, "UNAUTHORIZED", "PIN이 올바르지 않습니다.");
  }

  const staffToken = await signCouponJwt(
    {
      sub: staff.id,
      agencyId,
      role: staff.role,
      type: "agency_staff",
    },
    "12h",
  );

  await logCouponAudit(agencyId, CouponAuditAction.staff_login, staff.id, {
    role: staff.role,
  });

  return {
    staffToken,
    staff: { id: staff.id, name: staff.name, role: staff.role },
  };
}

export function assertManager(staff?: CouponStaffContext | null) {
  if (!staff || staff.role !== CouponStaffRole.manager) {
    throw new CouponApiError(403, "MANAGER_ONLY", "매니저만 이용할 수 있습니다.");
  }
}

export async function closeDay(agencyId: string, staffId: string) {
  const { start, end, dateLabel } = getVietnamDayBounds();

  const existing = await prisma.couponAuditLog.findFirst({
    where: {
      agencyId,
      action: CouponAuditAction.close_day,
      occurredAt: { gte: start, lt: end },
    },
  });
  if (existing) {
    return {
      date: dateLabel,
      duplicate: true,
      ...(existing.metadata as object),
    };
  }

  const redeemed = await prisma.couponAuditLog.count({
    where: {
      agencyId,
      action: CouponAuditAction.redeemed,
      occurredAt: { gte: start, lt: end },
    },
  });

  const cashConfirmed = await prisma.couponAuditLog.count({
    where: {
      agencyId,
      action: CouponAuditAction.cash_confirmed,
      occurredAt: { gte: start, lt: end },
    },
  });

  const feeAgg = await prisma.couponPlatformTxn.aggregate({
    where: { agencyId, occurredAt: { gte: start, lt: end } },
    _sum: { amount: true },
  });

  const summary = {
    date: dateLabel,
    redemptionCount: redeemed,
    cashConfirmedCount: cashConfirmed,
    platformFeeTotal: Number(feeAgg._sum.amount ?? 0),
    closedByStaffId: staffId,
  };

  await logCouponAudit(agencyId, CouponAuditAction.close_day, staffId, summary);

  return { ...summary, duplicate: false };
}
