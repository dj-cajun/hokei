"use client";

import { useCallback, useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

type IngestRun = {
  id: string;
  runAt: string;
  inserted: number;
  skipped: number;
  errors: string | null;
  errorDetails: string | null;
  durationMs: number | null;
  triggeredBy: string | null;
  timezone: string;
};

type Props = {
  initialRuns: IngestRun[];
};

export function IngestRunsPanel({ initialRuns }: Props) {
  const [runs, setRuns] = useState<IngestRun[]>(initialRuns);
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState<IngestRun | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/ingest-runs?limit=40");
      const data = (await res.json()) as {
        runs?: IngestRun[];
        error?: string;
      };
      if (res.ok && data.runs) {
        setRuns(data.runs);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  function parseDetails(raw: string | null): { message: string; at?: string }[] {
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw) as { message: string; at?: string }[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          NewsIngestRun — 크롤·번역 파이프라인 실행 이력
        </p>
        <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          새로고침
        </Button>
      </div>

      <div className="overflow-hidden rounded-2xl bg-surface">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="px-4 py-3 font-medium">실행 시각</th>
                <th className="px-4 py-3 font-medium">트리거</th>
                <th className="px-4 py-3 font-medium">추가</th>
                <th className="px-4 py-3 font-medium">건너뜀</th>
                <th className="px-4 py-3 font-medium">소요</th>
                <th className="px-4 py-3 font-medium">오류</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((run) => (
                <tr
                  key={run.id}
                  className="cursor-pointer border-b border-border last:border-0 hover:bg-secondary/40"
                  onClick={() => setDetail(run)}
                >
                  <td className="px-4 py-3 whitespace-nowrap">
                    {new Date(run.runAt).toLocaleString("ko-KR")}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">
                    {run.triggeredBy ?? "—"}
                  </td>
                  <td className="px-4 py-3">{run.inserted}</td>
                  <td className="px-4 py-3">{run.skipped}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {run.durationMs != null ? `${run.durationMs}ms` : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {run.errors ? (
                      <span className="text-amber-700">있음</span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              ))}
              {!loading && runs.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    수집 이력이 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {detail && (
        <div className="rounded-2xl border border-border bg-surface p-4">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold">실행 상세</h3>
            <button
              type="button"
              className="text-xs text-muted-foreground hover:text-foreground"
              onClick={() => setDetail(null)}
            >
              닫기
            </button>
          </div>
          <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">시각</dt>
              <dd>{new Date(detail.runAt).toLocaleString("ko-KR")}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">트리거</dt>
              <dd className="font-mono text-xs">{detail.triggeredBy ?? "—"}</dd>
            </div>
          </dl>
          {detail.errors && (
            <pre className="mt-3 max-h-48 overflow-auto rounded-xl bg-secondary/60 p-3 text-xs whitespace-pre-wrap">
              {detail.errors}
            </pre>
          )}
          {parseDetails(detail.errorDetails).length > 0 && (
            <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
              {parseDetails(detail.errorDetails).map((e, i) => (
                <li key={i}>
                  {e.at ? `[${e.at}] ` : ""}
                  {e.message}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
