import { cleanArticleBody } from "@/lib/news/article-body-clean";
import { log } from "@/lib/logger";

const JINA_READER_BASE = "https://r.jina.ai/";
const MIN_BODY_LENGTH = 80;

export function isJinaReaderEnabled(): boolean {
  return process.env.JINA_READER_ENABLED !== "0";
}

export type JinaReaderArticle = {
  title: string;
  content: string;
  img?: string | null;
};

/** r.jina.ai 응답에서 제목·본문 추출 */
export function parseJinaReaderResponse(text: string): JinaReaderArticle | null {
  const trimmed = text.trim();
  if (!trimmed) return null;

  let title = "";
  let content = trimmed;

  const titleMatch = trimmed.match(/^Title:\s*(.+)$/m);
  if (titleMatch?.[1]) {
    title = titleMatch[1].trim();
  }

  const markdownIdx = trimmed.search(
    /^Markdown Content:\s*$/m
  );
  if (markdownIdx >= 0) {
    content = trimmed
      .slice(markdownIdx)
      .replace(/^Markdown Content:\s*/m, "")
      .trim();
  } else {
    content = trimmed
      .replace(/^Title:\s*.+$/m, "")
      .replace(/^URL Source:\s*.+$/m, "")
      .replace(/^Published Time:\s*.+$/m, "")
      .replace(/^Warning:\s*.+$/m, "")
      .trim();
  }

  content = cleanArticleBody(content);
  if (content.length < MIN_BODY_LENGTH) return null;

  return {
    title,
    content: content.slice(0, 15_000),
    img: null,
  };
}

/**
 * Jina Reader — WAF·JS 렌더링 페이지 폴백 (Vercel에서도 동작)
 * https://jina.ai/reader
 */
export async function fetchArticleBodyViaJinaReader(
  url: string,
  fetchTimeoutMs: number
): Promise<JinaReaderArticle | null> {
  if (!isJinaReaderEnabled()) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), fetchTimeoutMs);

  const headers: Record<string, string> = {
    Accept: "text/plain",
    "X-Return-Format": "markdown",
    "X-Retain-Images": "none",
  };
  const apiKey = process.env.JINA_API_KEY?.trim();
  if (apiKey) {
    headers.Authorization = `Bearer ${apiKey}`;
  }

  try {
    const res = await fetch(`${JINA_READER_BASE}${url}`, {
      signal: controller.signal,
      headers,
      cache: "no-store",
    });

    if (!res.ok) {
      log("warn", "jina reader http", { url, status: res.status });
      return null;
    }

    const text = (await res.text()).slice(0, 600_000);
    const parsed = parseJinaReaderResponse(text);
    if (!parsed) {
      log("warn", "jina reader short", {
        url,
        chars: text.length,
      });
    }
    return parsed;
  } catch (error) {
    log("warn", "jina reader failed", {
      url,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
