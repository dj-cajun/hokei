"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Download, Loader2, Sparkles, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/providers/toast-provider";
import { parseApiError } from "@/lib/api-response";
import { isOfficialNoticeSource } from "@/lib/news/official-notice-feeds";
import { cn } from "@/lib/utils";
import type { PostTopic } from "@/lib/post-topic";

export type CurateCategoryOption = {
  id: string;
  label: string;
  slug: string;
};

type CurateNewsPanelProps = {
  categories: CurateCategoryOption[];
  defaultCategoryId: string;
};

export function CurateNewsPanel({
  categories,
  defaultCategoryId,
}: CurateNewsPanelProps) {
  const { showToast } = useToast();
  const [sourceUrl, setSourceUrl] = useState("");
  const [sourceName, setSourceName] = useState("");
  const [title, setTitle] = useState("");
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
      setContent(data.content ?? "");
      setThumbnail(data.thumbnail ?? null);
      setOriginalTitle(data.originalTitle ?? data.title ?? "");
      if (isOfficialNoticeSource(sourceName, sourceUrl.trim())) {
        setCategoryId(consulateCategoryId);
        setTopic("KOREA");
      }
      showToast("원문 본문을 불러왔습니다. 편집 후 게시하세요.");
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
          sourceUrl: sourceUrl.trim(),
          sourceName: sourceName.trim(),
          categoryId,
          thumbnail,
          originalTitle: originalTitle || title,
          mode: "full",
          topic,
        }),
      });
      const data = (await res.json()) as { error?: string; id?: string };
      if (!res.ok) {
        showToast(parseApiError(data) ?? "게시 실패", "error");
        return;
      }
      setPublishedId(data.id ?? null);
      showToast("뉴스로 게시했습니다.");
    } catch {
      showToast("요청 실패", "error");
    } finally {
      setPublishing(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-surface p-5">
        <h2 className="font-semibold">1. 출처 URL</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          총영사관·한인회 공지는 원문 본문을 가져와 게시합니다. 상세 페이지에
          본문과 원문 바로가기가 함께 표시됩니다. 일반 기사도 같은 방식으로
          재가공할 수 있습니다.
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
            onClick={() => void handleFullFetch()}
          >
            {fetching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            <span className="ml-2">URL에서 본문 가져오기</span>
          </Button>
        </div>
      </div>

      <div className="rounded-2xl bg-surface p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold">2. 확인 · 편집</h2>
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
          <div>
            <Label htmlFor="content">본문</Label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={14}
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
          뉴스 섹션에 올라가며, 상세 페이지에 본문과 원문 바로가기 버튼이 함께
          표시됩니다.
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
