"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/providers/toast-provider";
import { parseApiError } from "@/lib/api-response";
import { cn } from "@/lib/utils";

type ReportRow = {
  id: string;
  targetType: string;
  targetId: string;
  reason: string;
  detail: string | null;
  status: string;
  createdAt: string;
  targetTitle: string;
  targetHref: string;
};

export function ReportsQueue() {
  const { showToast } = useToast();
  const [status, setStatus] = useState("OPEN");
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [acting, setActing] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/reports?status=${encodeURIComponent(status)}&limit=40`
      );
      const data = (await res.json()) as { reports?: ReportRow[] };
      if (res.ok) setReports(data.reports ?? []);
    } finally {
      setLoading(false);
    }
  }, [status]);

  async function updateReport(
    id: string,
    nextStatus: "REVIEWING" | "RESOLVED" | "DISMISSED"
  ) {
    setActing(id);
    try {
      const res = await fetch(`/api/admin/reports/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!res.ok) {
        const data = await res.json();
        showToast(parseApiError(data) ?? "처리 실패", "error");
        return;
      }
      showToast("신고 상태가 변경되었습니다.");
      void load();
    } finally {
      setActing(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {(["OPEN", "REVIEWING", "RESOLVED", "DISMISSED", "ALL"] as const).map(
          (s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatus(s)}
              className={cn(
                "rounded-xl px-3 py-1.5 text-sm",
                status === s ? "bg-accent text-primary" : "bg-white text-muted-foreground"
              )}
            >
              {s}
            </button>
          )
        )}
        <Button size="sm" onClick={() => void load()} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "불러오기"}
        </Button>
      </div>

      <div className="space-y-2">
        {reports.map((r) => (
          <div key={r.id} className="rounded-2xl bg-white p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <span className="text-xs font-medium text-primary">
                  {r.targetType} · {r.reason}
                </span>
                <p className="mt-1 font-medium">{r.targetTitle}</p>
                {r.detail && (
                  <p className="mt-1 text-sm text-muted-foreground">{r.detail}</p>
                )}
                <p className="mt-1 text-xs text-muted-foreground">
                  {new Date(r.createdAt).toLocaleString("ko-KR")} · {r.status}
                </p>
              </div>
              <Link href={r.targetHref} target="_blank" className="text-primary">
                <ExternalLink className="h-4 w-4" />
              </Link>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {r.status === "OPEN" && (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={acting === r.id}
                  onClick={() => void updateReport(r.id, "REVIEWING")}
                >
                  검토 중
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                disabled={acting === r.id}
                onClick={() => void updateReport(r.id, "RESOLVED")}
              >
                처리 완료
              </Button>
              <Button
                size="sm"
                variant="ghost"
                disabled={acting === r.id}
                onClick={() => void updateReport(r.id, "DISMISSED")}
              >
                기각
              </Button>
            </div>
          </div>
        ))}
        {!loading && reports.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            해당 상태의 신고가 없습니다. 「불러오기」를 눌러 주세요.
          </p>
        )}
      </div>
    </div>
  );
}
