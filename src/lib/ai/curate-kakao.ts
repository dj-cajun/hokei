import {
  isOpenRouterConfigured,
  openRouterChat,
} from "@/lib/ai/openrouter";
import {
  buildCurateAnalyzePrompt,
  CURATE_ANALYZE_SYSTEM,
} from "@/lib/ai/curate-kakao-prompt";
import {
  classifyCurateItems,
  type CurateLifeUpdateItem,
  type CurateSkippedDuplicate,
  type CurateUpdateItem,
} from "@/lib/ai/curate-item-dedupe";
import {
  KAKAO_ANALYZE_MAX_GEMINI_CALLS,
  KAKAO_GEMINI_MAX_BLOCKS_PER_CALL,
  KAKAO_MAX_EXTRACTED_ITEMS,
  KAKAO_RAW_MAX_LENGTH,
  KAKAO_RAW_MIN_LENGTH,
} from "@/lib/ai/curate-kakao-limits";
import {
  splitKakaoTextIntoChunks,
  subdividePromptChunkForGemini,
} from "@/lib/ai/curate-kakao-split";
import {
  curateKakaoChunkResponseSchema,
  curateKakaoItemSchema,
  type CurateKakaoItem,
} from "@/lib/ai/curate-kakao-schemas";

export class CurateAnalyzeUserError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CurateAnalyzeUserError";
  }
}

export type CurateAnalyzeProvider = "openrouter";

function planAnalyzePromptChunks(rawText: string): string[] {
  const charChunks = splitKakaoTextIntoChunks(rawText);
  const promptChunks: string[] = [];
  for (const charChunk of charChunks) {
    promptChunks.push(
      ...subdividePromptChunkForGemini(
        charChunk,
        KAKAO_GEMINI_MAX_BLOCKS_PER_CALL
      )
    );
  }
  return promptChunks;
}

function extractJsonObject(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced?.[1]) return fenced[1].trim();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start >= 0 && end > start) return text.slice(start, end + 1);
  return text.trim();
}

function dedupeItems(items: CurateKakaoItem[]): CurateKakaoItem[] {
  const seen = new Set<string>();
  const out: CurateKakaoItem[] = [];
  for (const item of items) {
    const key = `${item.contentType}:${item.title.trim().toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

function parseCurateAnalyzeJson(raw: string): {
  items: unknown[];
  notes?: string;
} {
  const jsonText = extractJsonObject(raw);

  const tryParse = (text: string) => JSON.parse(text) as unknown;

  let data: unknown;
  try {
    data = tryParse(jsonText);
  } catch {
    const itemsIdx = jsonText.indexOf('"items"');
    const arrStart = jsonText.indexOf("[", itemsIdx);
    const lastItemEnd = jsonText.lastIndexOf("},");
    if (itemsIdx >= 0 && arrStart > itemsIdx && lastItemEnd > arrStart) {
      const repaired = `${jsonText.slice(0, lastItemEnd + 1)}]}`;
      data = tryParse(repaired);
    } else {
      throw new Error("AI 응답 JSON이 잘렸습니다. 텍스트를 나눠 다시 시도해 주세요.");
    }
  }

  if (!data || typeof data !== "object") {
    throw new Error("AI 응답 형식이 올바르지 않습니다.");
  }

  const record = data as { items?: unknown; notes?: unknown };
  const items = Array.isArray(record.items) ? record.items : [];
  const notes =
    typeof record.notes === "string" ? record.notes.slice(0, 2000) : undefined;

  return { items, notes };
}

function parseChunkResponse(raw: string) {
  const { items: rawItems, notes } = parseCurateAnalyzeJson(raw);
  const items: CurateKakaoItem[] = [];
  const issues: string[] = [];

  for (const row of rawItems.slice(0, 30)) {
    const parsed = curateKakaoItemSchema.safeParse(row);
    if (parsed.success) {
      items.push(parsed.data);
      continue;
    }
    const title =
      row && typeof row === "object" && "title" in row
        ? String((row as { title?: unknown }).title ?? "")
        : "";
    issues.push(title || parsed.error.issues[0]?.message || "항목 파싱 실패");
  }

  if (items.length === 0 && rawItems.length > 0) {
    throw new Error(
      `AI 항목을 읽지 못했습니다. ${issues[0] ?? "스키마 불일치"}`
    );
  }

  return curateKakaoChunkResponseSchema.parse({ items, notes });
}

async function analyzeChunk(
  chunk: string,
  meta?: { part: number; total: number }
): Promise<{
  items: CurateKakaoItem[];
  notes?: string;
  provider: CurateAnalyzeProvider;
}> {
  if (!isOpenRouterConfigured()) {
    throw new Error(
      "OPENROUTER_API_KEY가 필요합니다. .env.local에 OpenRouter API 키를 설정하세요."
    );
  }

  const raw = await openRouterChat(
    [
      { role: "system", content: CURATE_ANALYZE_SYSTEM },
      { role: "user", content: buildCurateAnalyzePrompt(chunk, meta) },
    ],
    { temperature: 0.2, maxTokens: 16384, jsonResponse: true }
  );

  try {
    const parsed = parseChunkResponse(raw);
    return { ...parsed, provider: "openrouter" };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "AI 응답 파싱 실패";
    throw new Error(`AI JSON 파싱 오류: ${message}`);
  }
}

export type CurateKakaoAnalyzeEnrichedResult = {
  items: CurateKakaoItem[];
  updateItems: CurateUpdateItem[];
  lifeUpdateItems: CurateLifeUpdateItem[];
  notes?: string;
  provider?: CurateAnalyzeProvider;
  skippedDuplicates: CurateSkippedDuplicate[];
  stats: {
    extracted: number;
    new: number;
    update: number;
    duplicate: number;
  };
};

export async function analyzeKakaoPaste(
  rawText: string
): Promise<CurateKakaoAnalyzeEnrichedResult> {
  const trimmed = rawText.trim();
  if (trimmed.length < KAKAO_RAW_MIN_LENGTH) {
    throw new CurateAnalyzeUserError("분석할 텍스트가 너무 짧습니다.");
  }
  if (trimmed.length > KAKAO_RAW_MAX_LENGTH) {
    throw new CurateAnalyzeUserError(
      `텍스트가 너무 깁니다. 최대 ${KAKAO_RAW_MAX_LENGTH.toLocaleString("ko-KR")}자까지 가능합니다. (현재 ${trimmed.length.toLocaleString("ko-KR")}자)`
    );
  }
  if (!isOpenRouterConfigured()) {
    throw new Error(
      "OPENROUTER_API_KEY가 필요합니다. .env.local에 OpenRouter API 키를 설정하세요."
    );
  }

  const promptChunks = planAnalyzePromptChunks(trimmed);
  if (promptChunks.length > KAKAO_ANALYZE_MAX_GEMINI_CALLS) {
    throw new CurateAnalyzeUserError(
      `이 구간의 메시지가 너무 많습니다. AI 호출 ${promptChunks.length}회가 필요합니다(한도 ${KAKAO_ANALYZE_MAX_GEMINI_CALLS}회). 더 짧은 구간으로 나눠 주세요.`
    );
  }

  const allItems: CurateKakaoItem[] = [];
  const notes: string[] = [];

  for (let i = 0; i < promptChunks.length; i++) {
    const result = await analyzeChunk(promptChunks[i], {
      part: i + 1,
      total: promptChunks.length,
    });
    allItems.push(...result.items);
    if (result.notes?.trim()) notes.push(result.notes.trim());
  }

  const extracted = dedupeItems(allItems).slice(0, KAKAO_MAX_EXTRACTED_ITEMS);
  const classified = await classifyCurateItems(extracted);

  const model = process.env.OPENROUTER_MODEL ?? "openai/gpt-4o-mini";
  const chunkNote =
    promptChunks.length > 1
      ? `${promptChunks.length}회 AI 분석을 완료했습니다.`
      : undefined;
  const providerNote = `OpenRouter (${model})로 분석했습니다.`;

  const dedupeNote =
    classified.stats.duplicate > 0 || classified.stats.update > 0
      ? `신규 ${classified.stats.new}건 · 업데이트 ${classified.stats.update}건 · 동일 제외 ${classified.stats.duplicate}건`
      : undefined;

  const mergedNotes = [chunkNote, providerNote, dedupeNote, ...notes]
    .filter(Boolean)
    .join("\n");

  if (
    classified.newItems.length === 0 &&
    classified.updateItems.length === 0 &&
    classified.lifeUpdateItems.length === 0
  ) {
    return {
      items: [],
      updateItems: [],
      lifeUpdateItems: [],
      notes:
        mergedNotes ||
        "신규·업데이트 항목이 없습니다. 모두 동일한 내용입니다.",
      provider: "openrouter",
      skippedDuplicates: classified.skippedDuplicates,
      stats: classified.stats,
    };
  }

  return {
    items: classified.newItems,
    updateItems: classified.updateItems,
    lifeUpdateItems: classified.lifeUpdateItems,
    notes: mergedNotes || undefined,
    provider: "openrouter",
    skippedDuplicates: classified.skippedDuplicates,
    stats: classified.stats,
  };
}

export { splitKakaoTextIntoChunks } from "@/lib/ai/curate-kakao-split";
