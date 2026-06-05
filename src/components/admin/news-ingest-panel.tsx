"use client";

import { useState } from "react";
import { Loader2, Newspaper, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/providers/toast-provider";
import { parseApiError } from "@/lib/api-response";

export function NewsIngestPanel() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function runIngest() {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/news-ingest", { method: "POST" });
      const data = (await res.json()) as {
        error?: string;
        message?: string;
        inserted?: number;
        skipped?: number;
        errors?: string[];
      };
      if (!res.ok) {
        const msg = parseApiError(data) ?? res.statusText;
        setResult(`오류: ${msg}`);
        showToast(msg, "error");
        return;
      }
      const text =
        `${data.message ?? "수집 완료"}\n추가: ${data.inserted ?? 0}건 · 건너뜀: ${data.skipped ?? 0}건` +
        (data.errors?.length
          ? `\n\n${data.errors.slice(0, 5).join("\n")}`
          : "");
      setResult(text);
      showToast(`뉴스 ${data.inserted ?? 0}건 추가`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "요청 실패";
      setResult(msg);
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl bg-white p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Newspaper className="h-5 w-5 text-primary" />
            <h2 className="font-semibold">뉴스 자동 수집</h2>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            네이버 뉴스 API + VnExpress(Int&apos;l RSS→Gemini) · 하루 최대 15건
            <br />
            스케줄: 매일 07:00 (Asia/Ho_Chi_Minh)
          </p>
        </div>
        <Button onClick={() => void runIngest()} disabled={loading} size="sm">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Play className="h-4 w-4" />
          )}
          지금 수집
        </Button>
      </div>
      {result && (
        <pre className="mt-4 whitespace-pre-wrap rounded-xl bg-secondary/60 p-3 text-xs text-foreground">
          {result}
        </pre>
      )}
    </div>
  );
}
