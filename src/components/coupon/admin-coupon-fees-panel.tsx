"use client";

import { useEffect, useState } from "react";
import { couponFetch } from "@/lib/coupon/api";
import type { WeeklyFeeReport } from "@/lib/coupon/types";

export function AdminCouponFeesPanel() {
  const [report, setReport] = useState<WeeklyFeeReport | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    const data = await couponFetch<WeeklyFeeReport>("/admin/fees/weekly");
    setReport(data);
  }

  useEffect(() => {
    load();
  }, []);

  async function refresh() {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  }

  const weekLabel =
    report &&
    `${new Date(report.weekStart).toLocaleDateString("ko-KR", { month: "short", day: "numeric" })} ~ ${new Date(report.weekEnd).toLocaleDateString("ko-KR", { month: "short", day: "numeric" })}`;

  const totalWeekFee =
    report?.agencies.reduce((sum, a) => sum + a.weekPlatformFee, 0) ?? 0;
  const totalPending =
    report?.agencies.reduce((sum, a) => sum + a.pendingPlatformFee, 0) ?? 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          이번 주({weekLabel ?? "…"}) 교환 기준 플랫폼 수수료
        </p>
        <button
          type="button"
          onClick={refresh}
          disabled={refreshing}
          className="shrink-0 text-sm text-primary hover:underline disabled:opacity-50"
        >
          {refreshing ? "새로고침 중..." : "새로고침"}
        </button>
      </div>

      {report ? (
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-border-light bg-surface p-4">
            <p className="text-xs text-muted-foreground">이번 주 수수료 합계</p>
            <p className="mt-1 text-lg font-bold">{totalWeekFee.toLocaleString()}₫</p>
          </div>
          <div className="rounded-xl border border-border-light bg-surface p-4">
            <p className="text-xs text-muted-foreground">미납(누적) 합계</p>
            <p className="mt-1 text-lg font-bold">{totalPending.toLocaleString()}₫</p>
          </div>
        </div>
      ) : null}

      {!report ? (
        <p className="text-sm text-muted-foreground">로딩 중...</p>
      ) : report.agencies.length === 0 ? (
        <p className="text-sm text-muted-foreground">등록된 업소가 없습니다.</p>
      ) : (
        <div className="space-y-2">
          {report.agencies.map((a) => (
            <div
              key={a.agencyId}
              className="rounded-xl border border-border-light bg-surface p-4"
            >
              <p className="font-semibold">{a.agencyName}</p>
              <p className="text-xs text-muted-foreground">{a.loginId}</p>
              <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                <dt className="text-muted-foreground">건당 수수료</dt>
                <dd className="text-right font-medium">
                  {a.commissionFixed.toLocaleString()}₫
                </dd>
                <dt className="text-muted-foreground">이번 주 교환</dt>
                <dd className="text-right font-medium">{a.weekRedemptionCount}건</dd>
                <dt className="text-muted-foreground">이번 주 수수료</dt>
                <dd className="text-right font-medium">
                  {a.weekPlatformFee.toLocaleString()}₫
                </dd>
                <dt className="text-muted-foreground">납부 예정</dt>
                <dd className="text-right font-bold text-primary">
                  {a.pendingPlatformFee.toLocaleString()}₫
                </dd>
              </dl>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
