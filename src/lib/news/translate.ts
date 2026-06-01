import { isNaverNewsAggregatorLink } from "@/lib/news/naver-news";
import { isMostlyKorean } from "@/lib/news/language";
import { translateWithGemini } from "@/lib/news/gemini-translate";
import { translateWithZai } from "@/lib/news/zai-translate";
import { isVnExpressArticle } from "@/lib/news/vnexpress";
import { isGeminiConfigured } from "@/lib/ai/gemini";
import { isZaiConfigured } from "@/lib/ai/zai";
import type { PostTopic } from "@/generated/prisma/client";

export type ProcessedNews = {
  title: string;
  description: string;
  /** naver-news: 네이버 검색 API / gemini·zai: AI 번역 / google-api: Cloud Translation(선택) */
  provider: "naver-news" | "gemini" | "zai" | "google-api";
};

const CHUNK_SIZE = 4500;

async function translateChunkGoogleApi(
  text: string,
  apiKey: string,
  target = "ko"
): Promise<string> {
  const params = new URLSearchParams({
    key: apiKey,
    target,
    format: "text",
    q: text,
  });

  const res = await fetch(
    `https://translation.googleapis.com/language/translate/v2?${params}`,
    { method: "POST", cache: "no-store" }
  );

  if (!res.ok) {
    throw new Error(`Google Translation API (${res.status})`);
  }

  const data = (await res.json()) as {
    data?: { translations?: { translatedText: string }[] };
  };

  return data.data?.translations?.[0]?.translatedText ?? text;
}

async function translateWithGoogleApi(
  title: string,
  description: string
): Promise<{ title: string; description: string }> {
  const key = process.env.GOOGLE_TRANSLATE_API_KEY?.trim();
  if (!key) throw new Error("GOOGLE_TRANSLATE_API_KEY 없음");

  const translate = async (t: string) => {
    if (t.length <= CHUNK_SIZE) return translateChunkGoogleApi(t, key);
    const parts: string[] = [];
    for (let i = 0; i < t.length; i += CHUNK_SIZE) {
      parts.push(t.slice(i, i + CHUNK_SIZE));
    }
    return (await Promise.all(parts.map((p) => translateChunkGoogleApi(p, key)))).join(
      ""
    );
  };

  const [tTitle, tDesc] = await Promise.all([
    translate(title),
    translate(description || title),
  ]);

  return { title: tTitle.trim(), description: tDesc.trim() };
}

/**
 * 네이버 뉴스·한국어 RSS 기사는 그대로 사용.
 * 영어·베트남어 등은 Gemini → Z.AI → Cloud Translation 순으로 한국어화.
 * ★ Cloud Translation API 키는 필수 아님
 */
export async function processNewsArticle(
  title: string,
  description: string,
  topic: PostTopic,
  meta?: { link?: string; sourceName?: string }
): Promise<ProcessedNews> {
  const link = meta?.link ?? "";
  const descTrim = description.trim();

  if (
    isNaverNewsAggregatorLink(link) &&
    (!descTrim || descTrim === title.trim() || descTrim.length < 40)
  ) {
    return {
      title: title.trim() || title,
      description: title.trim() || title,
      provider: "naver-news",
    };
  }

  const combined = `${title} ${description}`;
  const fromVnExpress = isVnExpressArticle(
    meta?.link ?? "",
    title,
    meta?.sourceName ?? ""
  );
  const needsTranslation =
    !isMostlyKorean(combined) || (fromVnExpress && /e\.vnexpress\.net/i.test(meta?.link ?? ""));

  let provider: ProcessedNews["provider"] = "naver-news";
  let titleKo = title;
  let descKo = description || title;

  if (needsTranslation) {
    try {
      if (isGeminiConfigured()) {
        const translated = await translateWithGemini(title, description, topic);
        titleKo = translated.title;
        descKo = translated.description;
        provider = "gemini";
      } else if (isZaiConfigured()) {
        const translated = await translateWithZai(title, description, topic);
        titleKo = translated.title;
        descKo = translated.description;
        provider = "zai";
      } else if (process.env.GOOGLE_TRANSLATE_API_KEY?.trim()) {
        const translated = await translateWithGoogleApi(title, description);
        titleKo = translated.title;
        descKo = translated.description;
        provider = "google-api";
      } else {
        throw new Error("번역 API 없음");
      }
    } catch {
      if (fromVnExpress) {
        titleKo = title;
        descKo = description || title;
        provider = "naver-news";
      } else {
        throw new Error("번역 실패");
      }
    }
  }

  const descriptionFinal = descKo.trim() || titleKo;

  return {
    title: titleKo.trim() || title,
    description: descriptionFinal,
    provider,
  };
}
