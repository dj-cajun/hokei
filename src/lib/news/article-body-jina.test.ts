import { describe, expect, it } from "vitest";
import { parseJinaReaderResponse } from "@/lib/news/article-body-jina";

describe("parseJinaReaderResponse", () => {
  it("parses markdown content block", () => {
    const raw = `Title: 테스트 기사 제목

URL Source: https://example.com/news/1

Published Time: 2026-06-21

Markdown Content:
이것은 본문 첫 문단입니다. 베트남 호치민에서 한인 커뮤니티가 모여 논의한 내용을 정리했습니다.
두 번째 문단도 충분히 길게 작성하여 최소 본문 길이 조건을 만족시킵니다.`;

    const parsed = parseJinaReaderResponse(raw);
    expect(parsed?.title).toBe("테스트 기사 제목");
    expect(parsed?.content).toContain("베트남 호치민");
    expect(parsed?.content.length).toBeGreaterThanOrEqual(80);
  });

  it("returns null for short body", () => {
    expect(parseJinaReaderResponse("Title: 짧음\n\nMarkdown Content:\n짧다")).toBeNull();
  });
});
