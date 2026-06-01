import { zaiChat, isZaiConfigured } from "@/lib/ai/zai";
import { TOPIC_LABELS } from "@/lib/news/sources";
import type { PostTopic } from "@/generated/prisma/client";

function extractJsonObject(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced?.[1]) return fenced[1].trim();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start >= 0 && end > start) return text.slice(start, end + 1);
  return text.trim();
}

/** 비한국어 기사만 Z.AI로 한국어 변환 (API 키는 .env ZAI_API_KEY) */
export async function translateWithZai(
  title: string,
  description: string,
  topic: PostTopic
): Promise<{ title: string; description: string }> {
  if (!isZaiConfigured()) {
    throw new Error("ZAI_API_KEY가 없습니다.");
  }

  const raw = await zaiChat(
    [
      {
        role: "system",
        content:
          "호치민 교민 포털 뉴스 에디터. 외국어를 자연스러운 한국어로 번역. JSON만 출력.",
      },
      {
        role: "user",
        content: `토픽: ${TOPIC_LABELS[topic]}

제목: ${title.slice(0, 500)}
본문: ${(description || title).slice(0, 2500)}

{"title":"한국어 제목","description":"한국어 본문 2~4문장"}`,
      },
    ],
    { temperature: 0.2, maxTokens: 1200 }
  );

  const parsed = JSON.parse(extractJsonObject(raw)) as {
    title?: string;
    description?: string;
  };

  return {
    title: parsed.title?.trim() || title,
    description: parsed.description?.trim() || description,
  };
}
