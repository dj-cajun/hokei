"use client";

import { FormEvent, useRef, useState } from "react";
import Link from "next/link";
import { Loader2, Sparkles, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/providers/toast-provider";
import { parseApiError } from "@/lib/api-response";
import type { CurateKakaoItem } from "@/lib/ai/curate-kakao-schemas";
import type {
  CurateSkippedDuplicate,
  CurateUpdateItem,
  CurateLifeUpdateItem,
} from "@/lib/ai/curate-item-dedupe";
import {
  CURATE_CONTENT_TYPE_LABELS,
} from "@/lib/ai/curate-kakao-types";
import { slugifyLifeTitle } from "@/lib/life/slugify-title";
import {
  KAKAO_ANALYZE_CLIENT_BATCH_SIZE,
  KAKAO_RAW_MAX_LENGTH,
  KAKAO_RAW_MIN_LENGTH,
} from "@/lib/ai/curate-kakao-limits";
import { splitKakaoTextIntoChunks } from "@/lib/ai/curate-kakao-split";
import {
  ingestKakaoCsvTexts,
  KAKAO_CSV_LOOKBACK_DAYS,
  type KakaoCsvIngestStats,
} from "@/lib/kakao/csv-ingest";
import { cn } from "@/lib/utils";

type PanelEntry = {
  kind: "new" | "update" | "life-update";
  item: CurateKakaoItem;
  updatePostId?: string;
  guideUpdateId?: string;
  mergedBody?: string;
  existingTitle?: string;
};

function buildPanelEntries(
  items: CurateKakaoItem[],
  updateItems: CurateUpdateItem[],
  lifeUpdateItems: CurateLifeUpdateItem[]
): PanelEntry[] {
  return [
    ...items.map((item) => ({ kind: "new" as const, item })),
    ...updateItems.map((u) => ({
      kind: "update" as const,
      item: u.item,
      updatePostId: u.postId,
      mergedBody: u.mergedBody,
      existingTitle: u.existingTitle,
    })),
    ...lifeUpdateItems.map((u) => ({
      kind: "life-update" as const,
      item: u.item,
      guideUpdateId: u.guideId,
      mergedBody: u.mergedBody,
      existingTitle: u.existingTitle,
    })),
  ];
}

type AnalyzeApiResult = {
  items?: CurateKakaoItem[];
  updateItems?: CurateUpdateItem[];
  lifeUpdateItems?: CurateLifeUpdateItem[];
  skippedDuplicates?: CurateSkippedDuplicate[];
  stats?: {
    extracted: number;
    new: number;
    update: number;
    duplicate: number;
  };
  notes?: string;
  provider?: "openrouter";
};

function mergeAnalyzeResults(results: AnalyzeApiResult[]) {
  const items: CurateKakaoItem[] = [];
  const updateItems: CurateUpdateItem[] = [];
  const lifeUpdateItems: CurateLifeUpdateItem[] = [];
  const skippedDuplicates: CurateSkippedDuplicate[] = [];
  const stats = { extracted: 0, new: 0, update: 0, duplicate: 0 };
  const notes: string[] = [];

  for (const data of results) {
    items.push(...((data.items ?? []) as CurateKakaoItem[]));
    updateItems.push(...((data.updateItems ?? []) as CurateUpdateItem[]));
    lifeUpdateItems.push(
      ...((data.lifeUpdateItems ?? []) as CurateLifeUpdateItem[])
    );
    skippedDuplicates.push(...(data.skippedDuplicates ?? []));
    if (data.stats) {
      stats.extracted += data.stats.extracted;
      stats.new += data.stats.new;
      stats.update += data.stats.update;
      stats.duplicate += data.stats.duplicate;
    }
    if (data.notes?.trim()) notes.push(data.notes.trim());
  }

  return {
    entries: buildPanelEntries(items, updateItems, lifeUpdateItems),
    skippedDuplicates,
    stats,
    notes: notes.join("\n"),
    provider: "openrouter" as const,
  };
}

async function fetchAnalyzeBatch(
  rawText: string,
  retries = 2
): Promise<
  | { ok: true; data: AnalyzeApiResult }
  | { ok: false; error: string }
> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const res = await fetch("/api/admin/ai-curate/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rawText }),
    });
    const data = (await res.json()) as AnalyzeApiResult & {
      ok?: boolean;
      error?: string;
    };
    if (res.ok && data.ok) {
      return { ok: true, data };
    }
    const message = parseApiError(data) ?? "AI 분석 실패";
    const retryable =
      res.status === 502 &&
      (message.includes("과부하") || message.includes("할당량"));
    if (retryable && attempt < retries) {
      await new Promise((r) => setTimeout(r, (attempt + 1) * 3000));
      continue;
    }
    return { ok: false, error: message };
  }
  return { ok: false, error: "AI 분석 실패" };
}

export function AiCuratePanel() {
  const { showToast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [rawText, setRawText] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeProgress, setAnalyzeProgress] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [notes, setNotes] = useState("");
  const [entries, setEntries] = useState<PanelEntry[]>([]);
  const [skippedDuplicates, setSkippedDuplicates] = useState<
    CurateSkippedDuplicate[]
  >([]);
  const [stats, setStats] = useState<{
    extracted: number;
    new: number;
    update: number;
    duplicate: number;
  } | null>(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const [activeKind, setActiveKind] = useState<PanelEntry["kind"]>("new");
  const [updatePostId, setUpdatePostId] = useState<string | undefined>();
  const [guideUpdateId, setGuideUpdateId] = useState<string | undefined>();
  const [existingTitle, setExistingTitle] = useState<string | undefined>();
  const [batchPublishing, setBatchPublishing] = useState(false);

  const [title, setTitle] = useState("");
  const [vnText, setVnText] = useState("");
  const [body, setBody] = useState("");
  const [slug, setSlug] = useState("");
  const [categorySlug, setCategorySlug] = useState("");
  const [storeName, setStoreName] = useState("");
  const [kakaoLink, setKakaoLink] = useState("");
  const [region, setRegion] = useState("");
  const [contentType, setContentType] =
    useState<CurateKakaoItem["contentType"]>("VIETNAMESE_STUDY");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [csvStats, setCsvStats] = useState<KakaoCsvIngestStats | null>(null);
  const txtRef = useRef<HTMLInputElement>(null);
  const csvRef = useRef<HTMLInputElement>(null);

  const rawLength = rawText.length;
  const rawTooLong = rawLength > KAKAO_RAW_MAX_LENGTH;

  function loadEntry(entry: PanelEntry, idx: number) {
    const item = entry.item;
    setActiveIdx(idx);
    setActiveKind(entry.kind);
    setUpdatePostId(entry.updatePostId);
    setGuideUpdateId(entry.guideUpdateId);
    setExistingTitle(entry.existingTitle);
    setTitle(item.title);
    setVnText(item.vnText ?? "");
    setBody(entry.mergedBody ?? item.body);
    setContentType(item.contentType);
    setCategorySlug(item.categorySlug ?? "");
    setStoreName(item.storeName ?? "");
    setKakaoLink(item.kakaoLink ?? "");
    setRegion(item.region ?? "");
    setSlug(
      item.slugSuggestion?.match(/^[a-z0-9-]+$/)
        ? item.slugSuggestion
        : slugifyLifeTitle(item.title)
    );
    setImageUrl(null);
  }

  async function handleCsvFiles(fileList: FileList | null) {
    if (!fileList?.length) return;
    const files = [...fileList];
    try {
      const inputs = await Promise.all(
        files.map(async (file) => ({
          name: file.name,
          content: await file.text(),
        }))
      );
      const result = ingestKakaoCsvTexts(inputs);
      if (!result.text.trim()) {
        showToast(
          `최근 ${KAKAO_CSV_LOOKBACK_DAYS}일 내 분석할 메시지가 없습니다.`,
          "error"
        );
        return;
      }
      setRawText(result.text);
      setCsvStats(result.stats);
      showToast(
        `CSV ${result.stats.files}개 · 최근 ${KAKAO_CSV_LOOKBACK_DAYS}일 ${result.stats.outputRows}건 (7일 밖 ${result.stats.dateSkipped} · 시스템 ${result.stats.systemSkipped} · 매크로중복 ${result.stats.macroDeduped} 제외)`,
        "success"
      );
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "CSV를 읽지 못했습니다.",
        "error"
      );
    }
  }

  async function handleAnalyze(e: FormEvent) {
    e.preventDefault();
    const trimmed = rawText.trim();
    if (trimmed.length < KAKAO_RAW_MIN_LENGTH) {
      showToast("카톡 텍스트를 붙여넣어 주세요.", "error");
      return;
    }
    if (trimmed.length > KAKAO_RAW_MAX_LENGTH) {
      showToast(
        `텍스트가 너무 깁니다. 최대 ${KAKAO_RAW_MAX_LENGTH.toLocaleString("ko-KR")}자까지 가능합니다.`,
        "error"
      );
      return;
    }
    setAnalyzing(true);
    setAnalyzeProgress(null);
    try {
      const batches = splitKakaoTextIntoChunks(
        trimmed,
        KAKAO_ANALYZE_CLIENT_BATCH_SIZE
      );
      const results: AnalyzeApiResult[] = [];

      for (let i = 0; i < batches.length; i++) {
        if (batches.length > 1) {
          setAnalyzeProgress(`${i + 1}/${batches.length} 구간 분석 중…`);
        }
        const result = await fetchAnalyzeBatch(batches[i]!);
        if (!result.ok) {
          showToast(
            batches.length > 1
              ? `${i + 1}/${batches.length} 구간 실패: ${result.error}`
              : result.error,
            "error"
          );
          return;
        }
        results.push(result.data);
      }

      const merged = mergeAnalyzeResults(results);
      const nextEntries = merged.entries;
      setEntries(nextEntries);
      setSkippedDuplicates(merged.skippedDuplicates);
      setStats(merged.stats);
      setNotes(
        batches.length > 1
          ? `${batches.length}개 구간 분석 완료${merged.notes ? `\n${merged.notes}` : ""}`
          : merged.notes
      );
      if (nextEntries.length > 0) loadEntry(nextEntries[0]!, 0);
      if (nextEntries.length === 0) {
        showToast(
          merged.notes || "신규·업데이트 항목이 없습니다.",
          "error"
        );
      } else {
        const s = merged.stats;
        showToast(
          `신규 ${s.new}건 · 업데이트 ${s.update}건 · 동일 제외 ${s.duplicate}건 (OpenRouter)`
        );
      }
    } catch {
      showToast("요청 실패", "error");
    } finally {
      setAnalyzing(false);
      setAnalyzeProgress(null);
    }
  }

  async function handleImageUpload(file: File) {
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/uploads", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        showToast(data.error ?? "업로드 실패", "error");
        return;
      }
      setImageUrl(data.url);
      showToast("이미지를 첨부했습니다.");
    } catch {
      showToast("업로드 실패", "error");
    } finally {
      setUploading(false);
    }
  }

  async function handlePublishAll() {
    const actionable = entries.filter((e) => e.item.contentType !== "UNKNOWN");
    if (actionable.length === 0) {
      showToast("반영할 항목이 없습니다.", "error");
      return;
    }

    setBatchPublishing(true);
    try {
      const res = await fetch("/api/admin/ai-curate/publish-batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: actionable.map((entry) => ({
            title: entry.item.title.trim(),
            vnText: entry.item.vnText?.trim() || undefined,
            body: entry.item.body.trim(),
            mergedBody: entry.mergedBody?.trim(),
            slug:
              entry.item.contentType === "VIETNAMESE_STUDY"
                ? entry.item.slugSuggestion?.match(/^[a-z0-9-]+$/)
                  ? entry.item.slugSuggestion
                  : slugifyLifeTitle(entry.item.title)
                : undefined,
            contentType: entry.item.contentType,
            categorySlug: entry.item.categorySlug?.trim() || undefined,
            storeName: entry.item.storeName?.trim() || undefined,
            kakaoLink: entry.item.kakaoLink?.trim() || undefined,
            region: entry.item.region?.trim() || undefined,
            priceVnd: entry.item.priceVnd,
            listingIntent: entry.item.listingIntent,
            itemKind: entry.item.itemKind,
            contactPhone: entry.item.contactPhone,
            contactKakaoId: entry.item.contactKakaoId,
            senderName: entry.item.senderName,
            messageAt: entry.item.messageAt,
            isCrawl: true,
            sourceLabel: entry.item.sourceLabel ?? "카톡 단톡방",
            updatePostId: entry.updatePostId,
            guideUpdateId: entry.guideUpdateId,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        showToast(parseApiError(data) ?? "일괄 반영 실패", "error");
        return;
      }
      const total =
        (data.published?.length ?? 0) + (data.updated?.length ?? 0);
      showToast(data.message ?? `반영 ${total}건`, total > 0 ? "success" : "error");
      if (total > 0) {
        setEntries([]);
        setStats(null);
      }
    } catch {
      showToast("일괄 발행 실패", "error");
    } finally {
      setBatchPublishing(false);
    }
  }

  async function handlePublish() {
    if (!title.trim() || !body.trim()) {
      showToast("제목·본문을 확인하세요.", "error");
      return;
    }
    if (contentType === "VIETNAMESE_STUDY" && !slug.trim()) {
      showToast("slug를 확인하세요.", "error");
      return;
    }
    if (contentType === "UNKNOWN") {
      showToast("분류 불가 항목은 발행할 수 없습니다.", "error");
      return;
    }
    if (contentType === "PROMO" && !storeName.trim()) {
      showToast("업소 홍보는 업체명이 필요합니다.", "error");
      return;
    }
    setPublishing(true);
    try {
      const res = await fetch("/api/admin/ai-curate/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          vnText: vnText.trim() || undefined,
          body: body.trim(),
          mergedBody:
            activeKind !== "new" ? body.trim() : undefined,
          slug: contentType === "VIETNAMESE_STUDY" ? slug.trim() : undefined,
          imageUrl: imageUrl ?? undefined,
          contentType,
          categorySlug: categorySlug.trim() || undefined,
          storeName: storeName.trim() || undefined,
          kakaoLink: kakaoLink.trim() || undefined,
          region: region.trim() || undefined,
          isCrawl: true,
          sourceLabel: "카톡 단톡방",
          updatePostId,
          guideUpdateId,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        showToast(parseApiError(data) ?? "발행 실패", "error");
        return;
      }
      showToast("발행했습니다.", "success");
      if (data.item?.href) {
        window.location.href = data.item.href;
      }
    } catch {
      showToast("발행 실패", "error");
    } finally {
      setPublishing(false);
    }
  }

  return (
    <div className="space-y-6">
      <form
        onSubmit={handleAnalyze}
        className="space-y-3 rounded-2xl bg-surface p-4 shadow-sm"
      >
        <div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Label htmlFor="rawText">카톡 원문 붙여넣기</Label>
            <div className="flex items-center gap-2">
              <input
                ref={txtRef}
                type="file"
                accept=".txt,text/plain"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  void file.text().then((text) => {
                    setRawText(text);
                    setCsvStats(null);
                    showToast(`${file.name} 불러옴 (${text.length.toLocaleString("ko-KR")}자)`);
                  }).catch(() => showToast("파일을 읽지 못했습니다.", "error"));
                  e.target.value = "";
                }}
              />
              <input
                ref={csvRef}
                type="file"
                accept=".csv,text/csv"
                multiple
                className="hidden"
                onChange={(e) => {
                  void handleCsvFiles(e.target.files);
                  e.target.value = "";
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => txtRef.current?.click()}
              >
                <Upload className="mr-1 h-3.5 w-3.5" />
                .txt 불러오기
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => csvRef.current?.click()}
              >
                <Upload className="mr-1 h-3.5 w-3.5" />
                .csv 불러오기 (최근 7일)
              </Button>
            </div>
          </div>
          <textarea
            id="rawText"
            value={rawText}
            onChange={(e) => {
              setRawText(e.target.value);
              setCsvStats(null);
            }}
            rows={10}
            placeholder="카톡보내기 .txt · CSV(여러 방, 최근 7일) 불러오기 · 또는 단톡 대화를 붙여넣으세요."
            className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-xs"
          />
          {csvStats ? (
            <p className="mt-1 text-xs text-primary">
              CSV {csvStats.files}개 · 원본 {csvStats.totalRows}행 → 최근{" "}
              {KAKAO_CSV_LOOKBACK_DAYS}일 {csvStats.outputRows}건 (기간 밖{" "}
              {csvStats.dateSkipped} · 시스템 {csvStats.systemSkipped} · 매크로
              중복 {csvStats.macroDeduped} 제외)
            </p>
          ) : null}
          <p
            className={cn(
              "mt-1 text-xs",
              rawTooLong ? "text-destructive" : "text-muted-foreground"
            )}
          >
            {rawLength.toLocaleString("ko-KR")} /{" "}
            {KAKAO_RAW_MAX_LENGTH.toLocaleString("ko-KR")}자
            {rawLength > KAKAO_ANALYZE_CLIENT_BATCH_SIZE &&
              !rawTooLong &&
              ` · ${Math.ceil(rawLength / KAKAO_ANALYZE_CLIENT_BATCH_SIZE)}개 구간으로 순차 분석`}
          </p>
        </div>
        <Button type="submit" disabled={analyzing || rawTooLong}>
          {analyzing ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="mr-2 h-4 w-4" />
          )}
          {analyzeProgress ?? "AI 분석 시작"}
        </Button>
      </form>

      {entries.length > 0 && (
        <div className="space-y-4 rounded-2xl bg-surface p-4 shadow-sm">
          {stats && (
            <p className="text-xs text-muted-foreground">
              추출 {stats.extracted}건 · 신규 {stats.new}건 · 업데이트{" "}
              {stats.update}건 · 동일 제외 {stats.duplicate}건
            </p>
          )}
          {notes && (
            <p className="text-xs text-muted-foreground">AI 메모: {notes}</p>
          )}
          {skippedDuplicates.length > 0 && (
            <details className="rounded-lg bg-muted/40 px-3 py-2 text-xs">
              <summary className="cursor-pointer font-medium text-muted-foreground">
                제외된 중복 {skippedDuplicates.length}건
              </summary>
              <ul className="mt-2 max-h-32 space-y-1 overflow-y-auto">
                {skippedDuplicates.map((s, i) => (
                  <li key={i} className="text-muted-foreground">
                    [{s.contentType}] {s.title} — {s.reason}
                  </li>
                ))}
              </ul>
            </details>
          )}

          {entries.length > 1 && (
            <div className="flex flex-wrap gap-1">
              {entries.map((entry, idx) => (
                <button
                  key={`${entry.kind}-${idx}`}
                  type="button"
                  onClick={() => loadEntry(entry, idx)}
                  className={cn(
                    "rounded-full px-2.5 py-1 text-[10px] font-medium",
                    activeIdx === idx
                      ? "bg-primary text-white"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {idx + 1}.{" "}
                  {entry.kind === "update" || entry.kind === "life-update"
                    ? "업데이트"
                    : "신규"}{" "}
                  {CURATE_CONTENT_TYPE_LABELS[entry.item.contentType]}
                </button>
              ))}
            </div>
          )}

          <p className="text-xs font-semibold text-primary">
            {(activeKind === "update" || activeKind === "life-update") && (
              <span className="mr-2 rounded bg-amber-100 px-1.5 py-0.5 text-amber-800">
                업데이트
              </span>
            )}
            {CURATE_CONTENT_TYPE_LABELS[contentType]}
            {contentType === "UNKNOWN" && (
              <span className="ml-2 text-amber-600">(발행 불가)</span>
            )}
          </p>
          {existingTitle && activeKind !== "new" && (
            <p className="text-xs text-muted-foreground">
              기존 글: {existingTitle}
            </p>
          )}

          {entries[activeIdx]?.item && (
            <div className="flex flex-wrap gap-1.5 text-[10px] text-muted-foreground">
              {entries[activeIdx]!.item.region && (
                <span className="rounded bg-muted px-1.5 py-0.5">
                  {entries[activeIdx]!.item.region}
                </span>
              )}
              {entries[activeIdx]!.item.priceVnd != null &&
                entries[activeIdx]!.item.priceVnd! > 0 && (
                  <span className="rounded bg-muted px-1.5 py-0.5">
                    {entries[activeIdx]!.item.priceVnd!.toLocaleString("ko-KR")}{" "}
                    VND
                  </span>
                )}
              {entries[activeIdx]!.item.contactPhone && (
                <span className="rounded bg-muted px-1.5 py-0.5">
                  {entries[activeIdx]!.item.contactPhone}
                </span>
              )}
              {entries[activeIdx]!.item.contactKakaoId && (
                <span className="rounded bg-muted px-1.5 py-0.5">
                  카톡 {entries[activeIdx]!.item.contactKakaoId}
                </span>
              )}
              {entries[activeIdx]!.item.storeName && (
                <span className="rounded bg-primary/10 px-1.5 py-0.5 text-primary">
                  {entries[activeIdx]!.item.storeName}
                </span>
              )}
            </div>
          )}

          <div>
            <Label htmlFor="curate-title">제목</Label>
            <Input
              id="curate-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1"
            />
          </div>
          {contentType === "VIETNAMESE_STUDY" && (
            <div>
              <Label htmlFor="curate-vn">베트남어 원문</Label>
              <Input
                id="curate-vn"
                value={vnText}
                onChange={(e) => setVnText(e.target.value)}
                className="mt-1"
              />
            </div>
          )}
          <div>
            <Label htmlFor="curate-body">본문</Label>
            <textarea
              id="curate-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={8}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
          {(contentType === "PROMO" ||
            contentType === "REAL_ESTATE" ||
            contentType === "CLASSIFIED" ||
            contentType === "JOBS") && (
            <>
              <div>
                <Label htmlFor="curate-category">하위 카테고리 slug</Label>
                <Input
                  id="curate-category"
                  value={categorySlug}
                  onChange={(e) => setCategorySlug(e.target.value)}
                  placeholder="promo-store"
                  className="mt-1 font-mono text-xs"
                />
              </div>
              {contentType === "PROMO" && (
                <div>
                  <Label htmlFor="curate-store">업체명</Label>
                  <Input
                    id="curate-store"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    className="mt-1"
                  />
                </div>
              )}
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label htmlFor="curate-region">지역</Label>
                  <Input
                    id="curate-region"
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    placeholder="7군"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="curate-kakao">카톡 링크</Label>
                  <Input
                    id="curate-kakao"
                    value={kakaoLink}
                    onChange={(e) => setKakaoLink(e.target.value)}
                    className="mt-1 text-xs"
                  />
                </div>
              </div>
            </>
          )}
          {contentType === "VIETNAMESE_STUDY" && (
            <div>
              <Label htmlFor="curate-slug">slug (URL)</Label>
              <Input
                id="curate-slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                pattern="[a-z0-9-]+"
                className="mt-1 font-mono text-xs"
              />
            </div>
          )}

          <div>
            <Label>이미지 첨부 (선택)</Label>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void handleImageUpload(f);
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={uploading}
                onClick={() => fileRef.current?.click()}
              >
                {uploading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="mr-2 h-4 w-4" />
                )}
                파일 선택
              </Button>
              {imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imageUrl}
                  alt=""
                  className="h-16 w-16 rounded border object-cover"
                />
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              onClick={() => void handlePublishAll()}
              disabled={batchPublishing || publishing}
            >
              {batchPublishing && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              신규·업데이트 {entries.length}건 타임라인 반영
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => void handlePublish()}
              disabled={publishing || batchPublishing}
            >
              {publishing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              현재 항목만 발행
            </Button>
            <Button type="button" variant="outline" asChild>
              <Link href="/promo">홍보 허브</Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
