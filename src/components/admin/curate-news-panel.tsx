"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Download, Link2, Loader2, Sparkles, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/providers/toast-provider";
import { parseApiError } from "@/lib/api-response";
import { cn } from "@/lib/utils";
import type { PostTopic } from "@/lib/post-topic";

export type CurateCategoryOption = {
  id: string;
  label: string;
  slug: string;
};

type CurateMode = "outlink" | "full";

type CurateNewsPanelProps = {
  categories: CurateCategoryOption[];
  defaultCategoryId: string;
};

export function CurateNewsPanel({
  categories,
  defaultCategoryId,
}: CurateNewsPanelProps) {
  const { showToast } = useToast();
  const [mode, setMode] = useState<CurateMode>("outlink");
  const [sourceUrl, setSourceUrl] = useState("");
  const [sourceName, setSourceName] = useState("");
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [originalTitle, setOriginalTitle] = useState("");
  const [categoryId, setCategoryId] = useState(defaultCategoryId);
  const [topic, setTopic] = useState<PostTopic>("KOREA");
  const [fetching, setFetching] = useState(false);
  const [rewriting, setRewriting] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishedId, setPublishedId] = useState<string | null>(null);

  const consulateCategoryId = useMemo(
    () =>
      categories.find((c) => c.slug === "news-consulate-association")?.id ??
      defaultCategoryId,
    [categories, defaultCategoryId]
  );

  async function handleOutlinkPreview() {
    if (!sourceUrl.trim()) {
      showToast("공지 URL을 입력하세요.", "error");
      return;
    }
    setFetching(true);
    setPublishedId(null);
    try {
      const res = await fetch("/api/admin/curate/outlink-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceUrl: sourceUrl.trim(),
          sourceName: sourceName.trim() || undefined,
        }),
      });
      const data = (await res.json()) as {
        error?: string;
        title?: string;
        summary?: string;
        content?: string;
        sourceName?: string;
        thumbnail?: string | null;
        categoryId?: string | null;
        topic?: PostTopic;
        provider?: string;
      };
      if (!res.ok) {
        showToast(parseApiError(data) ?? "메타 추출 실패", "error");
        return;
      }
      setTitle(data.title ?? "");
      setSummary(data.summary ?? "");
      setContent(data.content ?? "");
      setThumbnail(data.thumbnail ?? null);
      setOriginalTitle(data.title ?? "");
      if (data.sourceName) setSourceName(data.sourceName);
      if (data.categoryId) setCategoryId(data.categoryId);
      else setCategoryId(consulateCategoryId);
      if (data.topic) setTopic(data.topic);
      const via =
        data.provider === "gemini"
          ? "Gemini"
          : data.provider === "zai"
            ? "Z.AI"
            : "자동";
      showToast(`${via}로 아웃링크 카드 초안을 채웠습니다. 확인 후 발행하세요.`);
    } catch {
      showToast("요청 실패", "error");
    } finally {
      setFetching(false);
    }
  }

  async function handleFullFetch() {
    if (!sourceUrl.trim()) {
      showToast("출처 URL을 입력하세요.", "error");
      return;
    }
    setFetching(true);
    setPublishedId(null);
    try {
      const res = await fetch("/api/admin/curate/fetch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceUrl: sourceUrl.trim(),
          sourceName: sourceName.trim() || undefined,
        }),
      });
      const data = (await res.json()) as {
        error?: string;
        title?: string;
        content?: string;
        thumbnail?: string | null;
        originalTitle?: string;
      };
      if (!res.ok) {
        showToast(parseApiError(data) ?? "가져오기 실패", "error");
        return;
      }
      setTitle(data.title ?? "");
      setSummary("");
      setContent(data.content ?? "");
      setThumbnail(data.thumbnail ?? null);
      setOriginalTitle(data.originalTitle ?? data.title ?? "");
      showToast("원문 초안을 불러왔습니다. 편집 후 게시하세요.");
    } catch {
      showToast("요청 실패", "error");
    } finally {
      setFetching(false);
    }
  }

  async function handleRewrite() {
    if (!title.trim() || !content.trim()) {
      showToast("제목과 본문을 입력하세요.", "error");
      return;
    }
    setRewriting(true);
    try {
      const res = await fetch("/api/admin/curate/rewrite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          content,
          sourceName: sourceName.trim() || undefined,
        }),
      });
      const data = (await res.json()) as {
        error?: string;
        title?: string;
        content?: string;
        provider?: string;
      };
      if (!res.ok) {
        showToast(parseApiError(data) ?? "재가공 실패", "error");
        return;
      }
      setTitle(data.title ?? title);
      setContent(data.content ?? content);
      const via =
        data.provider === "zai"
          ? "Z.AI"
          : data.provider === "gemini"
            ? "Gemini"
            : "AI";
      showToast(`${via} 재가공을 적용했습니다.`);
    } catch {
      showToast("요청 실패", "error");
    } finally {
      setRewriting(false);
    }
  }

  async function handlePublish() {
    if (!sourceUrl.trim() || !sourceName.trim()) {
      showToast("출처 URL과 출처 이름을 입력하세요.", "error");
      return;
    }
    setPublishing(true);
    try {
      const res = await fetch("/api/admin/curate/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          content,
          summary: summary.trim() || undefined,
          sourceUrl: sourceUrl.trim(),
          sourceName: sourceName.trim(),
          categoryId,
          thumbnail,
          originalTitle: originalTitle || title,
          mode,
          topic,
        }),
      });
      const data = (await res.json()) as { error?: string; id?: string };
      if (!res.ok) {
        showToast(parseApiError(data) ?? "게시 실패", "error");
        return;
      }
      setPublishedId(data.id ?? null);
      showToast(
        mode === "outlink"
          ? "아웃링크 뉴스로 게시했습니다."
          : "뉴스로 게시했습니다."
      );
    } catch {
      showToast("요청 실패", "error");
    } finally {
      setPublishing(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant={mode === "outlink" ? "default" : "outline"}
          onClick={() => setMode("outlink")}
        >
          <Link2 className="h-4 w-4" />
          <span className="ml-1.5">3초 컷 아웃링크</span>
        </Button>
        <Button
          type="button"
          size="sm"
          variant={mode === "full" ? "default" : "outline"}
          onClick={() => setMode("full")}
        >
          <Download className="h-4 w-4" />
          <span className="ml-1.5">본문 재가공</span>
        </Button>
      </div>

      <div className="rounded-2xl bg-surface p-5">
        <h2 className="font-semibold">1. 출처 URL</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {mode === "outlink"
            ? "총영사관·한인회 공지 링크를 붙여넣으면 AI가 제목·요약만 추출합니다. 원문 전문은 저장하지 않습니다."
            : "외부 기사 URL에서 본문을 가져와 재가공합니다. 출처 링크는 글 하단에 표시됩니다."}
        </p>
        <div className="mt-4 space-y-3">
          <div>
            <Label htmlFor="sourceUrl">원문 URL</Label>
            <Input
              id="sourceUrl"
              type="url"
              placeholder="https://..."
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="sourceName">출처 이름</Label>
            <Input
              id="sourceName"
              placeholder="예: 주호치민 대한민국 총영사관"
              value={sourceName}
              onChange={(e) => setSourceName(e.target.value)}
              className="mt-1"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={fetching}
            onClick={() =>
              void (mode === "outlink" ? handleOutlinkPreview() : handleFullFetch())
            }
          >
            {fetching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : mode === "outlink" ? (
              <Link2 className="h-4 w-4" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            <span className="ml-2">
              {mode === "outlink" ? "메타데이터 추출" : "URL에서 가져오기"}
            </span>
          </Button>
        </div>
      </div>

      <div className="rounded-2xl bg-surface p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold">2. 확인 · 편집</h2>
          {mode === "full" && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={rewriting}
              onClick={() => void handleRewrite()}
            >
              {rewriting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              <span className="ml-2">AI 재가공</span>
            </Button>
          )}
        </div>
        <div className="mt-4 space-y-3">
          <div>
            <Label htmlFor="categoryId">카테고리</Label>
            <select
              id="categoryId"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className={cn(
                "mt-1 flex h-10 w-full rounded-xl border border-border bg-secondary/50 px-3 text-sm",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              )}
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="title">제목</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1"
            />
          </div>
          {mode === "outlink" && (
            <div>
              <Label htmlFor="summary">한 줄 요약 (목록·OG)</Label>
              <Input
                id="summary"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                className="mt-1"
              />
            </div>
          )}
          <div>
            <Label htmlFor="content">
              {mode === "outlink" ? "상세 안내 (짧은 요약)" : "본문"}
            </Label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={mode === "outlink" ? 6 : 14}
              className={cn(
                "mt-1 w-full rounded-xl border border-border bg-secondary/50 px-3 py-2 text-sm",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              )}
            />
          </div>
          <div>
            <Label htmlFor="thumbnail">썸네일 URL (선택)</Label>
            <Input
              id="thumbnail"
              type="url"
              placeholder="https://..."
              value={thumbnail ?? ""}
              onChange={(e) => setThumbnail(e.target.value.trim() || null)}
              className="mt-1"
            />
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-surface p-5">
        <h2 className="font-semibold">3. 게시</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {mode === "outlink"
            ? "메인·뉴스 탭에 카드가 올라가고, 상세에서 원문 공지로 바로 이동합니다."
            : "뉴스 섹션에 올라가며 상세 페이지에 원문 링크가 붙습니다."}
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button
            type="button"
            disabled={publishing}
            onClick={() => void handlePublish()}
          >
            {publishing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            <span className="ml-2">발행</span>
          </Button>
          {publishedId && (
            <Link
              href={`/posts/${publishedId}`}
              className="text-sm font-medium text-primary hover:underline"
            >
              게시글 보기 →
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
