import { geminiChat, isGeminiConfigured } from "@/lib/ai/gemini";
import { isZaiConfigured, zaiChat } from "@/lib/ai/zai";

export type CurateRewriteProvider = "gemini" | "zai";

function extractJsonObject(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced?.[1]) return fenced[1].trim();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start >= 0 && end > start) return text.slice(start, end + 1);
  return text.trim();
}

function buildRewriteUserPrompt(input: {
  title: string;
  content: string;
  sourceName?: string;
}): string {
  return `출처 사이트: ${input.sourceName?.trim() || "교민 커뮤니티/뉴스"}

원제목: ${input.title.slice(0, 500)}
원문/메모:
${input.content.slice(0, 6000)}

호치민·베트남 거주 한국 교민이 읽기 쉽게 재가공하세요.
- 핵심 사실은 유지하고 과장·추측 금지
- 3~8문단, 각 문단은 짧게
- 비자·학교·부동산·생활 팁이 있으면 앞쪽에 배치
- 마지막에 「※ 원문은 아래 출처 링크를 참고하세요.」 한 줄

{"title":"재가공 제목","content":"본문(줄바꿈은 \\n)"}`;
}

const REWRITE_SYSTEM =
  "호케이 Hokei 편집자. JSON만 출력. 저작권상 원문 전문 복사 대신 요약·재구성.";

function parseRewriteResponse(raw: string): { title: string; content: string } {
  const parsed = JSON.parse(extractJsonObject(raw)) as {
    title?: string;
    content?: string;
  };

  const title = parsed.title?.trim();
  const content = parsed.content?.trim().replace(/\\n/g, "\n");
  if (!title || !content) {
    throw new Error("AI 재가공 결과가 비어 있습니다.");
  }

  return { title, content };
}

async function rewriteWithGemini(input: {
  title: string;
  content: string;
  sourceName?: string;
}): Promise<{ title: string; content: string }> {
  const raw = await geminiChat(
    [{ role: "user", content: buildRewriteUserPrompt(input) }],
    {
      system: REWRITE_SYSTEM,
      temperature: 0.35,
      maxTokens: 2500,
      jsonResponse: true,
    }
  );
  return parseRewriteResponse(raw);
}

async function rewriteWithZai(input: {
  title: string;
  content: string;
  sourceName?: string;
}): Promise<{ title: string; content: string }> {
  const raw = await zaiChat(
    [
      { role: "system", content: REWRITE_SYSTEM },
      { role: "user", content: buildRewriteUserPrompt(input) },
    ],
    { temperature: 0.35, maxTokens: 2500 }
  );
  return parseRewriteResponse(raw);
}

/** 관리자 큐레이션 — 호치민 교민용으로 재가공 (Gemini → Z.AI 폴백) */
export async function rewriteForCuratedNews(input: {
  title: string;
  content: string;
  sourceName?: string;
}): Promise<{ title: string; content: string; provider: CurateRewriteProvider }> {
  const geminiOk = isGeminiConfigured();
  const zaiOk = isZaiConfigured();

  if (!geminiOk && !zaiOk) {
    throw new Error(
      "GEMINI_API_KEY 또는 ZAI_API_KEY가 필요합니다. .env에 AI 키를 설정하세요."
    );
  }

  if (geminiOk) {
    try {
      const result = await rewriteWithGemini(input);
      return { ...result, provider: "gemini" };
    } catch (err) {
      if (!zaiOk) throw err;
      console.warn(
        "[curate-rewrite] Gemini 실패 — Z.AI 폴백:",
        err instanceof Error ? err.message : String(err)
      );
    }
  }

  const result = await rewriteWithZai(input);
  return { ...result, provider: "zai" };
}
