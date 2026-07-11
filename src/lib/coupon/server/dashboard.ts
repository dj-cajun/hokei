import { CouponStaffRole } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { getNextMonday, getWeekBounds } from "./common/week-bounds";

function canViewFees(staffRole?: CouponStaffRole | null) {
  return !staffRole || staffRole === CouponStaffRole.manager;
}

export async function getDashboardSummary(
  agencyId: string,
  staffRole?: CouponStaffRole | null,
) {
  const { start, end } = getWeekBounds();
  const agency = await prisma.couponAgency.findUniqueOrThrow({
    where: { id: agencyId },
  });

  const agg = await prisma.couponPlatformTxn.aggregate({
    where: {
      agencyId,
      occurredAt: { gte: start, lt: end },
    },
    _sum: { amount: true },
    _count: true,
  });

  const weekPlatformFee = Number(agg._sum.amount ?? 0);
  const pendingPlatformFee = Number(agency.balance);
  const showFees = canViewFees(staffRole);

  return {
    weekCount: agg._count,
    weekPlatformFee: showFees ? weekPlatformFee : null,
    pendingPlatformFee: showFees ? pendingPlatformFee : null,
    commissionFixed: showFees ? Number(agency.commissionFixed) : null,
    commissionPercent:
      showFees && agency.commissionPercent != null
        ? Number(agency.commissionPercent)
        : null,
    nextSettlementDate: getNextMonday().toISOString(),
    currency: "VND",
    staffRole: staffRole ?? null,
    feesHidden: !showFees,
    weekRevenue: showFees ? weekPlatformFee : null,
    pendingBalance: showFees ? pendingPlatformFee : null,
  };
}

export async function listTransactions(
  agencyId: string,
  limit = 20,
  staffRole?: CouponStaffRole | null,
) {
  const showFees = canViewFees(staffRole);
  const rows = await prisma.couponPlatformTxn.findMany({
    where: { agencyId },
    orderBy: { occurredAt: "desc" },
    take: limit,
  });
  return rows.map((t) => ({
    id: t.id,
    productName: t.productName,
    amount: showFees ? Number(t.amount) : null,
    productPrice:
      showFees && t.productPrice != null ? Number(t.productPrice) : null,
    occurredAt: t.occurredAt.toISOString(),
  }));
}

export async function getWeeklyPlatformFeeReport() {
  const { start, end } = getWeekBounds();
  const agencies = await prisma.couponAgency.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });

  const agencyRows = await Promise.all(
    agencies.map(async (agency) => {
      const agg = await prisma.couponPlatformTxn.aggregate({
        where: {
          agencyId: agency.id,
          occurredAt: { gte: start, lt: end },
        },
        _sum: { amount: true },
        _count: true,
      });

      return {
        agencyId: agency.id,
        agencyName: agency.name,
        loginId: agency.loginId,
        commissionFixed: Number(agency.commissionFixed),
        commissionPercent:
          agency.commissionPercent != null
            ? Number(agency.commissionPercent)
            : null,
        weekRedemptionCount: agg._count,
        weekPlatformFee: Number(agg._sum.amount ?? 0),
        pendingPlatformFee: Number(agency.balance),
      };
    }),
  );

  return {
    weekStart: start.toISOString(),
    weekEnd: end.toISOString(),
    agencies: agencyRows,
  };
}
