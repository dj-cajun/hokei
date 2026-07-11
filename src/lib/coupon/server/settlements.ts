import { CouponSettlementStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

function getLastWeekBounds(now = new Date()) {
  const day = now.getDay();
  const diffToThisMonday = day === 0 ? -6 : 1 - day;
  const thisMonday = new Date(now);
  thisMonday.setHours(0, 0, 0, 0);
  thisMonday.setDate(thisMonday.getDate() + diffToThisMonday);

  const lastMonday = new Date(thisMonday);
  lastMonday.setDate(lastMonday.getDate() - 7);

  return { periodStart: lastMonday, periodEnd: thisMonday };
}

export async function runWeeklySettlement(force = false) {
  const now = new Date();
  if (!force && now.getDay() !== 1) {
    return { skipped: true };
  }

  const { periodStart, periodEnd } = getLastWeekBounds(now);
  const agencies = await prisma.couponAgency.findMany({
    where: { isActive: true },
  });
  const results: Array<Record<string, unknown>> = [];

  for (const agency of agencies) {
    const balance = Number(agency.balance);
    if (balance <= 0) continue;

    const unsettled = await prisma.couponPlatformTxn.findMany({
      where: {
        agencyId: agency.id,
        settlementId: null,
        occurredAt: { gte: periodStart, lt: periodEnd },
      },
    });

    if (unsettled.length === 0 && balance <= 0) continue;

    const existing = await prisma.couponSettlement.findFirst({
      where: {
        agencyId: agency.id,
        periodStart,
        periodEnd,
        status: CouponSettlementStatus.completed,
      },
    });
    if (existing) {
      results.push({
        agencyId: agency.id,
        skipped: true,
        settlementId: existing.id,
      });
      continue;
    }

    const settlement = await prisma.$transaction(async (tx) => {
      const totalAmount = balance;
      const transactionCount =
        unsettled.length ||
        (await tx.couponPlatformTxn.count({
          where: { agencyId: agency.id, settlementId: null },
        }));

      const created = await tx.couponSettlement.create({
        data: {
          agencyId: agency.id,
          periodStart,
          periodEnd,
          totalAmount,
          transactionCount,
          status: CouponSettlementStatus.completed,
          settledAt: now,
        },
      });

      await tx.couponPlatformTxn.updateMany({
        where: { agencyId: agency.id, settlementId: null },
        data: { settlementId: created.id },
      });

      await tx.couponAgency.update({
        where: { id: agency.id },
        data: { balance: 0 },
      });

      return created;
    });

    results.push({
      agencyId: agency.id,
      settlementId: settlement.id,
      amount: balance,
    });
  }

  return { settled: results };
}
