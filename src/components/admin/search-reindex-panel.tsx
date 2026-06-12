"use client";

import { useState } from "react";
import { Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/providers/toast-provider";
import { parseApiError } from "@/lib/api-response";

type SearchReindexPanelProps = {
  databaseKind: "sqlite" | "postgresql";
};

export function SearchReindexPanel({ databaseKind }: SearchReindexPanelProps) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState<string | null>(null);

  const isSqlite = databaseKind === "sqlite";

  async function runReindex() {
    if (!isSqlite) return;
    setLoading(true);
    setDetail(null);
    try {
      const res = await fetch("/api/admin/reindex-search", { method: "POST" });
      const data = (await res.json()) as {
        error?: string;
        indexed?: number;
        ok?: boolean;
      };
      if (!res.ok) {
        const msg = parseApiError(data) ?? "재인덱스 실패";
        setDetail(msg);
        showToast(msg, "error");
        return;
      }
      const n = data.indexed ?? 0;
      const msg = `${n}개 글 검색 인덱스 반영`;
      setDetail(msg);
      showToast(msg);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "요청 실패";
      setDetail(msg);
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl bg-surface p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Search className="h-5 w-5 text-primary" />
            <h2 className="font-semibold">검색 인덱스</h2>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {isSqlite
              ? "SQLite FTS5 전체 재인덱스 (글 대량 반영 후 실행)"
              : "PostgreSQL은 ILIKE 검색을 사용합니다. FTS 재인덱스는 필요 없습니다."}
          </p>
        </div>
        <Button
          onClick={() => void runReindex()}
          disabled={loading || !isSqlite}
          size="sm"
          variant="outline"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "재인덱스"
          )}
        </Button>
      </div>
      {detail && (
        <p className="mt-3 text-xs text-muted-foreground">{detail}</p>
      )}
    </div>
  );
}
