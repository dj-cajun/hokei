import { KAKAO_ANALYZE_CHUNK_SIZE } from "@/lib/ai/curate-kakao-limits";

/** 날짜 구분선 (모바일 카톡보내기) */
const KAKAO_DATE_LINE =
  /^(?:-{3,}\s*)?\d{4}년\s*\d{1,2}월\s*\d{1,2}일/u;

/** PC 카톡보내기: 2026. 5. 4. 17:08, 발신자 : 본문 */
const KAKAO_PC_EXPORT_LINE =
  /^(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})\.\s*(\d{1,2}):(\d{2}),\s*(.+?)\s*:\s*(.*)$/u;

/** 메시지 시간 헤더 — [이름] [오후 3:12] */
const KAKAO_MESSAGE_TIME =
  /^(?:\[[^\]]+\]\s*)?(?:\[[^\]]+\]\s*)?(?:오전|오후)\s*\d{1,2}:\d{2}/u;

const KAKAO_MESSAGE_TIME_ALT =
  /^[\w가-힣][\w가-힣\s]{0,20}\s+(?:오전|오후)\s*\d{1,2}:\d{2}/u;

export type KakaoTimeBlock = {
  timeLabel: string;
  text: string;
  senderName?: string;
  messageAt?: string;
};

function pad2(n: string): string {
  return n.padStart(2, "0");
}

/** PC 대화보내기 한 줄 형식 파싱 */
export function splitKakaoPcExportLines(text: string): KakaoTimeBlock[] | null {
  const lines = text.split(/\n/);
  const blocks: KakaoTimeBlock[] = [];
  let matched = 0;

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;

    const m = line.match(KAKAO_PC_EXPORT_LINE);
    if (m) {
      matched++;
      const [, y, mo, d, h, mi, sender, body] = m;
      const messageAt = `${y}-${pad2(mo)}-${pad2(d)}T${pad2(h)}:${mi}:00+07:00`;
      blocks.push({
        timeLabel: `${y}. ${mo}. ${d}. ${h}:${mi}, ${sender.trim()}`,
        senderName: sender.trim(),
        messageAt,
        text: body.trim(),
      });
      continue;
    }

    const last = blocks[blocks.length - 1];
    if (last) {
      last.text = `${last.text}\n${line}`.trim();
    }
  }

  const nonEmpty = lines.filter((l) => l.trim().length > 0);
  if (matched >= 2 && matched / Math.max(nonEmpty.length, 1) >= 0.15) {
    return blocks.filter((b) => b.text.length > 0);
  }
  return null;
}

/** 카톡 원문을 시간 단락(메시지 블록)으로 분리 */
export function splitKakaoIntoTimeBlocks(text: string): KakaoTimeBlock[] {
  const pc = splitKakaoPcExportLines(text);
  if (pc && pc.length > 0) return pc;

  const lines = text.split(/\n/);
  const blocks: KakaoTimeBlock[] = [];
  let currentDate = "";
  let currentTime = "";
  let buf: string[] = [];

  const flush = () => {
    const body = buf.join("\n").trim();
    if (!body) {
      buf = [];
      return;
    }
    const label = [currentDate, currentTime].filter(Boolean).join(" ").trim();
    blocks.push({
      timeLabel: label || `단락 ${blocks.length + 1}`,
      text: body,
    });
    buf = [];
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      flush();
      continue;
    }

    if (KAKAO_DATE_LINE.test(trimmed)) {
      flush();
      currentDate = trimmed.replace(/^-{3,}\s*/, "").trim();
      currentTime = "";
      continue;
    }

    if (
      KAKAO_MESSAGE_TIME.test(trimmed) ||
      KAKAO_MESSAGE_TIME_ALT.test(trimmed)
    ) {
      flush();
      currentTime = trimmed;
      const rest = trimmed
        .replace(/^(?:\[[^\]]+\]\s*)+/u, "")
        .replace(/^(?:오전|오후)\s*\d{1,2}:\d{2}\s*/u, "")
        .trim();
      if (rest && !KAKAO_MESSAGE_TIME.test(rest)) {
        buf.push(rest);
      }
      continue;
    }

    buf.push(trimmed);
  }

  flush();

  if (blocks.length <= 1 && text.length > 300) {
    return text
      .split(/\n{2,}/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0)
      .map((t, i) => ({
        timeLabel: `단락 ${i + 1}`,
        text: t,
      }));
  }

  return blocks;
}

/** 잡담·짧은 반응은 AI 분석 대상에서 제외 */
export function filterPublishableKakaoBlocks(
  blocks: KakaoTimeBlock[]
): KakaoTimeBlock[] {
  return blocks.filter((b) => {
    const t = b.text.trim();
    if (t.length < 10) return false;
    if (/^(?:ㅋ|ㅎ|ㅇㅋ|ㅇㅇ|ok|네|응|ㅠㅠ|감사|수고)+[.!~]*$/iu.test(t)) {
      return false;
    }
    return true;
  });
}

export function parsePromptChunkToBlocks(chunk: string): KakaoTimeBlock[] {
  const parts = chunk.split(/\n\n+/);
  const blocks: KakaoTimeBlock[] = [];

  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const m = trimmed.match(/^=== \[(.+?)\] ===\n([\s\S]*)$/);
    if (m) {
      blocks.push({ timeLabel: m[1]!, text: m[2]!.trim() });
    }
  }

  return blocks;
}

/** 10만자 청크를 Gemini 호출 단위(최대 N개 시간 단락)로 재분할 */
export function subdividePromptChunkForGemini(
  chunk: string,
  maxBlocks: number
): string[] {
  const blocks = parsePromptChunkToBlocks(chunk);
  if (blocks.length === 0) return [chunk];
  if (blocks.length <= maxBlocks) return [chunk];

  const out: string[] = [];
  for (let i = 0; i < blocks.length; i += maxBlocks) {
    out.push(formatKakaoTimeBlocksForPrompt(blocks.slice(i, i + maxBlocks)));
  }
  return out;
}

export function formatKakaoTimeBlocksForPrompt(blocks: KakaoTimeBlock[]): string {
  return blocks
    .map((b) => `=== [${b.timeLabel}] ===\n${b.text}`)
    .join("\n\n");
}

export function splitKakaoTextIntoChunks(
  text: string,
  chunkSize = KAKAO_ANALYZE_CHUNK_SIZE
): string[] {
  const blocks = filterPublishableKakaoBlocks(splitKakaoIntoTimeBlocks(text));
  if (blocks.length === 0) return [text.trim()].filter(Boolean);

  const chunks: string[] = [];
  let currentBlocks: KakaoTimeBlock[] = [];
  let currentLen = 0;

  const flushChunk = () => {
    if (currentBlocks.length === 0) return;
    chunks.push(formatKakaoTimeBlocksForPrompt(currentBlocks));
    currentBlocks = [];
    currentLen = 0;
  };

  for (const block of blocks) {
    const blockText = `=== [${block.timeLabel}] ===\n${block.text}`;
    const blockLen = blockText.length + 2;

    if (block.text.length > chunkSize) {
      flushChunk();
      for (const piece of splitOversizedText(block.text, chunkSize)) {
        chunks.push(`=== [${block.timeLabel}] ===\n${piece}`);
      }
      continue;
    }

    if (currentLen + blockLen > chunkSize && currentBlocks.length > 0) {
      flushChunk();
    }

    currentBlocks.push(block);
    currentLen += blockLen;
  }

  flushChunk();
  return chunks.filter((c) => c.trim().length > 0);
}

export function splitKakaoIntoParagraphs(text: string): string[] {
  return splitKakaoIntoTimeBlocks(text).map((b) => b.text);
}

function splitOversizedText(text: string, chunkSize: number): string[] {
  const out: string[] = [];
  let pos = 0;
  while (pos < text.length) {
    let end = Math.min(pos + chunkSize, text.length);
    if (end < text.length) {
      const nl = text.lastIndexOf("\n", end);
      if (nl > pos + chunkSize * 0.5) end = nl + 1;
    }
    const piece = text.slice(pos, end).trim();
    if (piece) out.push(piece);
    pos = end;
  }
  return out;
}
