"use client";

import { FormEvent, useEffect, useState } from "react";
import { useToast } from "@/components/providers/toast-provider";
import { parseApiError } from "@/lib/api-response";

type HomeYouTubeState = {
  url: string;
  videoId: string;
  startSeconds: number;
  source: string;
};

export function HomeYoutubePanel() {
  const { showToast } = useToast();
  const [url, setUrl] = useState("");
  const [preview, setPreview] = useState<HomeYouTubeState | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void fetch("/api/admin/settings/home-youtube")
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) {
          setUrl(data.url ?? "");
          setPreview({
            url: data.url ?? "",
            videoId: data.videoId,
            startSeconds: data.startSeconds,
            source: data.source,
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings/home-youtube", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(parseApiError(data) ?? "저장에 실패했습니다.", "error");
        return;
      }
      setPreview({
        url: data.url ?? "",
        videoId: data.videoId,
        startSeconds: data.startSeconds,
        source: data.source,
      });
      showToast("홈 유튜브 영상이 저장되었습니다.");
    } catch {
      showToast("저장 중 오류가 발생했습니다.", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleClear() {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings/home-youtube", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: "" }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(parseApiError(data) ?? "초기화에 실패했습니다.", "error");
        return;
      }
      setUrl("");
      setPreview({
        url: "",
        videoId: data.videoId,
        startSeconds: data.startSeconds,
        source: data.source,
      });
      showToast("DB 설정을 지웠습니다. 환경 변수·기본값이 적용됩니다.");
    } catch {
      showToast("초기화 중 오류가 발생했습니다.", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-2xl bg-surface">
      <div className="border-b border-border px-5 py-4">
        <h2 className="font-semibold">홈 화면 YouTube</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          홈 하이라이트 영상 URL을 설정합니다. 비우면 환경 변수·기본 영상이
          사용됩니다.
        </p>
      </div>
      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-3 px-5 py-4">
        <label className="block text-sm">
          <span className="font-medium">YouTube URL</span>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=…&t=12"
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus-ring"
            disabled={loading || saving}
          />
        </label>
        {preview && !loading && (
          <p className="text-xs text-muted-foreground">
            현재 적용: {preview.videoId}
            {preview.startSeconds > 0 ? ` · ${preview.startSeconds}초부터` : ""}
            {preview.source === "db" && preview.url
              ? " (관리자 설정)"
              : preview.source === "env"
                ? " (환경 변수)"
                : " (기본값)"}
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={loading || saving}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            {saving ? "저장 중…" : "저장"}
          </button>
          <button
            type="button"
            disabled={loading || saving}
            onClick={() => void handleClear()}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-card-hover disabled:opacity-50"
          >
            DB 설정 지우기
          </button>
        </div>
      </form>
    </section>
  );
}
