"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Plus, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/providers/toast-provider";
import { parseApiError } from "@/lib/api-response";

type Source = {
  id: string;
  topic: string;
  type: string;
  query: string | null;
  url: string | null;
  sourceName: string;
  isEnabled: boolean;
  sortOrder: number;
};

export function NewsSourcesPanel() {
  const { showToast } = useToast();
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/news-sources");
      const data = (await res.json()) as { sources?: Source[] };
      if (res.ok) setSources(data.sources ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  async function syncFromCode() {
    const res = await fetch("/api/admin/news-sources?sync=code", {
      method: "POST",
    });
    const data = await res.json();
    if (!res.ok) {
      showToast(parseApiError(data) ?? "동기화 실패", "error");
      return;
    }
    showToast(`코드에서 ${data.added ?? 0}건 추가`);
    void load();
  }

  async function toggleEnabled(id: string, isEnabled: boolean) {
    const res = await fetch(`/api/admin/news-sources/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isEnabled: !isEnabled }),
    });
    if (res.ok) void load();
  }

  return (
    <div className="space-y-4 rounded-2xl bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-semibold">수집 소스 (DB)</h2>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => void syncFromCode()}>
            <RefreshCw className="mr-1 h-4 w-4" />
            코드→DB 동기화
          </Button>
          <Button size="sm" variant="outline" onClick={() => void load()} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "새로고침"}
          </Button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        비활성 소스는 다음 수집부터 제외됩니다. 첫 로드 시 DB가 비어 있으면 자동 시드됩니다.
      </p>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b text-muted-foreground">
              <th className="py-2 pr-2">토픽</th>
              <th className="py-2 pr-2">유형</th>
              <th className="py-2 pr-2">검색어/URL</th>
              <th className="py-2 pr-2">출처</th>
              <th className="py-2">활성</th>
            </tr>
          </thead>
          <tbody>
            {sources.map((s) => (
              <tr key={s.id} className="border-b border-border last:border-0">
                <td className="py-2 pr-2 text-xs">{s.topic}</td>
                <td className="py-2 pr-2">{s.type}</td>
                <td className="max-w-[240px] truncate py-2 pr-2 font-mono text-xs">
                  {s.query ?? s.url ?? "—"}
                </td>
                <td className="py-2 pr-2">{s.sourceName}</td>
                <td className="py-2">
                  <button
                    type="button"
                    className={s.isEnabled ? "text-green-700" : "text-muted-foreground"}
                    onClick={() => void toggleEnabled(s.id, s.isEnabled)}
                  >
                    {s.isEnabled ? "ON" : "OFF"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {sources.length === 0 && !loading && (
        <Button size="sm" onClick={() => void load()}>
          <Plus className="mr-1 h-4 w-4" />
          소스 목록 불러오기
        </Button>
      )}
    </div>
  );
}
