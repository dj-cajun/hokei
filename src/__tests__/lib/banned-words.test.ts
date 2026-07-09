import { describe, expect, it } from "vitest";
import {
  findBannedWord,
  parseBannedWordsInput,
} from "@/lib/moderation/banned-words";

describe("banned-words", () => {
  it("parses lines and dedupes case-insensitively", () => {
    expect(parseBannedWordsInput("광고\n텔레그램\n광고")).toEqual([
      "광고",
      "텔레그램",
    ]);
  });

  it("finds banned word in text", () => {
    expect(
      findBannedWord(["제목 환전 대행 합니다"], ["환전"])
    ).toBe("환전");
  });

  it("returns null when no match", () => {
    expect(findBannedWord(["일반 글"], ["스팸키워드"])).toBeNull();
  });
});
