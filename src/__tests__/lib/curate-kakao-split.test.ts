import { describe, expect, it } from "vitest";
import {
  splitKakaoPcExportLines,
  splitKakaoTextIntoChunks,
  subdividePromptChunkForGemini,
} from "@/lib/ai/curate-kakao-split";
import { KAKAO_GEMINI_MAX_BLOCKS_PER_CALL } from "@/lib/ai/curate-kakao-limits";

describe("splitKakaoPcExportLines", () => {
  it("PC 카톡보내기 한 줄 형식을 시간 단락으로 분리한다", () => {
    const text = `2026. 5. 4. 17:08, 모아 홈즈 부동산 : Q2 타오디엔 스튜디오 풀옵션 2500만동
2026. 5. 6. 17:57, 대박호치민 : 2011년식 야마하 루비아스 판매 8,000,000`;

    const blocks = splitKakaoPcExportLines(text);
    expect(blocks).not.toBeNull();
    expect(blocks!.length).toBe(2);
    expect(blocks![0]!.senderName).toBe("모아 홈즈 부동산");
    expect(blocks![0]!.text).toContain("Q2 타오디엔");
    expect(blocks![1]!.senderName).toBe("대박호치민");
  });

  it("짧은 메시지가 많아도 글자 수 기준으로만 10만자 청크를 만든다", () => {
    const text = Array.from(
      { length: 25 },
      (_, i) =>
        `2026. 5. ${(i % 28) + 1}. 17:08, 발신자${i} : 7군 아파트 렌트 ${2500 + i}만동`
    ).join("\n");

    const chunks = splitKakaoTextIntoChunks(text);
    expect(chunks.length).toBe(1);
  });

  it("10만자 청크를 Gemini 호출 단위로 재분할한다", () => {
    const blocks = Array.from(
      { length: 65 },
      (_, i) => `=== [2026. 5. 1. 17:08, 발신자${i}] ===\n7군 아파트 ${i}`
    ).join("\n\n");

    const parts = subdividePromptChunkForGemini(
      blocks,
      KAKAO_GEMINI_MAX_BLOCKS_PER_CALL
    );
    expect(parts.length).toBe(3);
    for (const part of parts) {
      const blockCount = (part.match(/=== \[/g) ?? []).length;
      expect(blockCount).toBeLessThanOrEqual(KAKAO_GEMINI_MAX_BLOCKS_PER_CALL);
    }
  });
});
