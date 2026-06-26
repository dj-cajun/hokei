import { geminiChat, isGeminiConfigured } from "@/lib/ai/gemini";
import { isZaiConfigured, zaiChat } from "@/lib/ai/zai";
import {
  normalizeOutlinkCategorySlug,
  resolveNewsCategorySlug,
} from "@/lib/news/resolve-news-category";
import { parseOgImageFromHtml } from "@/lib/news/image";
import { isOfficialNoticeSource } from "@/lib/news/official-notice-feeds";
import type { PostTopic } from "@/generated/prisma/client";

const USER_AGENT =
  "Mozilla/5.0 (compatible; HokeiNewsBot/1.0; +https://hokei.vn)";
const FETCH_TIMEOUT_MS = 12_000;
const SNIPPET_MAX = 2_500;

export type CurateOutlinkPreviewInput = {
  sourceUrl: string;
  sourceName?: string;
};

export type CurateOutlinkPreviewResult = {
  title: string;
  summary: string;
  content: string;
  sourceUrl: string;
  sourceName: string;
  categorySlug: string;
  topic: PostTopic;
  thumbnail: string | null;
  provider?: "gemini" | "zai" | "heuristic";
};

function extractJsonObject(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced?.[1]) return fenced[1].trim();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start >= 0 && end > start) return text.slice(start, end + 1);
  return text.trim();
}

function stripHtmlToSnippet(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, SNIPPET_MAX);
}

function parseTitleFromHtml(html: string): string | undefined {
  const og = html.match(
    /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i
  );
  if (og?.[1]) return og[1].trim();
  const title = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return title?.[1]?.trim();
}

function parseDescriptionFromHtml(html: string): string | undefined {
  const patterns = [
    /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i,
  ];
  for (const pattern of patterns) {
    const m = html.match(pattern);
    if (m?.[1]?.trim()) return m[1].trim();
  }
  return undefined;
}

export async function fetchPageSignals(
  sourceUrl: string
): Promise<{
  pageTitle: string;
  pageDescription: string;
  snippet: string;
  thumbnail: string | null;
}> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(sourceUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
      cache: "no-store",
    });
    if (!res.ok) {
      throw new Error(`페이지를 열 수 없습니다. (HTTP ${res.status})`);
    }
    const html = (await res.text()).slice(0, 200_000);
    const pageTitle = parseTitleFromHtml(html) ?? "";
    const pageDescription = parseDescriptionFromHtml(html) ?? "";
    const snippet =
      pageDescription || stripHtmlToSnippet(html).slice(0, SNIPPET_MAX);
    const thumbnail = parseOgImageFromHtml(html) ?? null;
    return { pageTitle, pageDescription, snippet, thumbnail };
  } finally {
    clearTimeout(timeout);
  }
}

function inferSourceName(
  sourceUrl: string,
  hint?: string,
  aiName?: string
): string {
  const fromAi = aiName?.trim();
  if (fromAi && fromAi.length >= 2) return fromAi;
  const fromHint = hint?.trim();
  if (fromHint && fromHint.length >= 2) return fromHint;
  if (/mofa\.go\.kr|overseas\.mofa/i.test(sourceUrl)) {
    return "주호치민 대한민국 총영사관";
  }
  if (/consulate.*hochiminh|hochiminh.*consulate/i.test(sourceUrl)) {
    return "주호치민 대한민국 총영사관";
  }
  if (/한인회|korean.*association/i.test(sourceUrl)) {
    return "호치민 한인회";
  }
  try {
    return new URL(sourceUrl).hostname.replace(/^www\./, "");
  } catch {
    return "공식 기관";
  }
}

function inferTitlePrefix(sourceName: string, sourceUrl: string): string {
  const text = `${sourceName} ${sourceUrl}`;
  if (/총영사관|영사관|대사관|consulate|embassy|mofa/i.test(text)) {
    return "[총영사관]";
  }
  if (/한인회|상공회의소|KOTRA|korcham/i.test(text)) {
    return "[한인회]";
  }
  return "[공지]";
}

function buildOutlinkUserPrompt(input: {
  sourceUrl: string;
  sourceNameHint?: string;
  pageTitle: string;
  snippet: string;
}): string {
  return `URL: ${input.sourceUrl}
힌트 출처명: ${input.sourceNameHint?.trim() || "(없음)"}
페이지 제목: ${input.pageTitle.slice(0, 300)}
페이지 요약/발췌:
${input.snippet.slice(0, SNIPPET_MAX)}

호치민 한국 교민 포털용 **아웃링크 카드** 메타데이터만 추출하세요. 원문 전문 복사 금지.

categorySlug 규칙:
- 비자·체류·입국·영사 업무·보안·환전·사기 주의 등 → news-visa-residency
- 한인회·동포회·행사·커뮤니티 생존 Q&A 성격 → news-consulate-association
  (community-survival-qa 로 판단되면 categorySlug에 community-survival-qa 라고 적어도 됨)

title: 기관 접두사 포함. 예) [총영사관] 호치민 교민 대상 온라인 스캠 주의 당부
summary: 1~2문장, 160자 이내, 사실만
sourceName: 공식 기관명 (예: 주호치민 대한민국 총영사관)
body: 유저 상세에 보일 짧은 안내 2~4문장. 원문 요약만. 마지막 줄은 반드시 「자세한 내용은 아래 원문 공지에서 확인해 주세요.」

JSON만:
{"categorySlug":"news-visa-residency","title":"...","summary":"...","sourceName":"...","body":"..."}`;
}

const OUTLINK_SYSTEM =
  "호케이 Hokei 편집자. 국가기관·한인회 공지 아웃링크 큐레이션. JSON만 출력. 저작권상 원문 전문 금지.";

function parseAiOutlinkJson(raw: string): {
  categorySlug: string;
  title: string;
  summary: string;
  sourceName: string;
  body: string;
} {
  const parsed = JSON.parse(extractJsonObject(raw)) as {
    categorySlug?: string;
    title?: string;
    summary?: string;
    sourceName?: string;
    body?: string;
  };
  const title = parsed.title?.trim();
  const summary = parsed.summary?.trim();
  const body = parsed.body?.trim().replace(/\\n/g, "\n");
  const sourceName = parsed.sourceName?.trim();
  if (!title || !summary || !body) {
    throw new Error("AI 메타데이터가 비어 있습니다.");
  }
  return {
    categorySlug: normalizeOutlinkCategorySlug(parsed.categorySlug),
    title,
    summary,
    sourceName: sourceName || "공식 기관",
    body,
  };
}

function heuristicPreview(input: {
  sourceUrl: string;
  sourceNameHint?: string;
  pageTitle: string;
  pageDescription: string;
  snippet: string;
  thumbnail: string | null;
}): CurateOutlinkPreviewResult {
  const sourceName = inferSourceName(
    input.sourceUrl,
    input.sourceNameHint,
    undefined
  );
  const prefix = inferTitlePrefix(sourceName, input.sourceUrl);
  const baseTitle =
    input.pageTitle.replace(/\s*[-|｜].*$/, "").trim() ||
    "공식 공지";
  const title = baseTitle.startsWith("[")
    ? baseTitle
    : `${prefix} ${baseTitle}`.trim();
  const summary =
    input.pageDescription.slice(0, 160) ||
    input.snippet.slice(0, 160) ||
    title;
  const categorySlug = resolveNewsCategorySlug({
    topic: "KOREA",
    title,
    summary,
    sourceName,
    sourceUrl: input.sourceUrl,
  });
  const body = `${summary}\n\n자세한 내용은 아래 원문 공지에서 확인해 주세요.`;
  const topic: PostTopic =
    categorySlug === "news-visa-residency" ? "VIETNAM_POLICY" : "KOREA";

  return {
    title,
    summary,
    content: body,
    sourceUrl: input.sourceUrl,
    sourceName,
    categorySlug,
    topic,
    thumbnail: input.thumbnail,
    provider: "heuristic",
  };
}

async function previewWithGemini(signals: {
  sourceUrl: string;
  sourceNameHint?: string;
  pageTitle: string;
  snippet: string;
  thumbnail: string | null;
}): Promise<CurateOutlinkPreviewResult> {
  const raw = await geminiChat(
    [{ role: "user", content: buildOutlinkUserPrompt(signals) }],
    {
      system: OUTLINK_SYSTEM,
      temperature: 0.2,
      maxTokens: 1200,
      jsonResponse: true,
    }
  );
  const parsed = parseAiOutlinkJson(raw);
  const sourceName = inferSourceName(
    signals.sourceUrl,
    signals.sourceNameHint,
    parsed.sourceName
  );
  const categorySlug = normalizeOutlinkCategorySlug(parsed.categorySlug);
  const topic: PostTopic =
    categorySlug === "news-visa-residency" ? "VIETNAM_POLICY" : "KOREA";

  return {
    title: parsed.title,
    summary: parsed.summary.slice(0, 160),
    content: parsed.body,
    sourceUrl: signals.sourceUrl,
    sourceName,
    categorySlug,
    topic,
    thumbnail: signals.thumbnail,
    provider: "gemini",
  };
}

async function previewWithZai(signals: {
  sourceUrl: string;
  sourceNameHint?: string;
  pageTitle: string;
  snippet: string;
  thumbnail: string | null;
}): Promise<CurateOutlinkPreviewResult> {
  const raw = await zaiChat(
    [
      { role: "system", content: OUTLINK_SYSTEM },
      { role: "user", content: buildOutlinkUserPrompt(signals) },
    ],
    { temperature: 0.2, maxTokens: 1200 }
  );
  const parsed = parseAiOutlinkJson(raw);
  const sourceName = inferSourceName(
    signals.sourceUrl,
    signals.sourceNameHint,
    parsed.sourceName
  );
  const categorySlug = normalizeOutlinkCategorySlug(parsed.categorySlug);
  const topic: PostTopic =
    categorySlug === "news-visa-residency" ? "VIETNAM_POLICY" : "KOREA";

  return {
    title: parsed.title,
    summary: parsed.summary.slice(0, 160),
    content: parsed.body,
    sourceUrl: signals.sourceUrl,
    sourceName,
    categorySlug,
    topic,
    thumbnail: signals.thumbnail,
    provider: "zai",
  };
}

/** 관리자 3초 컷 — URL만으로 아웃링크 카드 메타 추출 (본문 전문 X) */
export async function previewCurateOutlink(
  input: CurateOutlinkPreviewInput
): Promise<CurateOutlinkPreviewResult> {
  const sourceUrl = input.sourceUrl.trim();
  const signals = await fetchPageSignals(sourceUrl);

  if (!signals.pageTitle && !signals.snippet) {
    throw new Error("페이지에서 제목·요약을 읽지 못했습니다.");
  }

  const payload = {
    sourceUrl,
    sourceNameHint: input.sourceName,
    pageTitle: signals.pageTitle,
    snippet: signals.snippet,
    thumbnail: signals.thumbnail,
  };

  const geminiOk = isGeminiConfigured();
  const zaiOk = isZaiConfigured();

  if (geminiOk) {
    try {
      return await previewWithGemini(payload);
    } catch (err) {
      if (!zaiOk) {
        if (isOfficialNoticeSource(input.sourceName, sourceUrl)) {
          return heuristicPreview({
            ...payload,
            pageDescription: signals.pageDescription,
          });
        }
        throw err;
      }
      console.warn(
        "[curate-outlink] Gemini 실패 — Z.AI 폴백:",
        err instanceof Error ? err.message : String(err)
      );
    }
  }

  if (zaiOk) {
    try {
      return await previewWithZai(payload);
    } catch {
      return heuristicPreview({
        ...payload,
        pageDescription: signals.pageDescription,
      });
    }
  }

  return heuristicPreview({
    ...payload,
    pageDescription: signals.pageDescription,
  });
}

export function formatOutlinkCtaLabel(sourceName?: string | null): string {
  const name = sourceName?.trim() ?? "";
  if (/총영사관|영사관|대사관|consulate|embassy/i.test(name)) {
    return "대사관 원본 공지 바로가기";
  }
  if (/한인회|상공회의소|KOTRA/i.test(name)) {
    return "한인회 원본 공지 바로가기";
  }
  return "원본 공지 바로가기";
}
