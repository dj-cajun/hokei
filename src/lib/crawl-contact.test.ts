import { describe, expect, it } from "vitest";
import {
  buildCrawlContactChips,
  extractPhones,
  inferContactLine,
} from "./crawl-contact";

describe("crawl-contact", () => {
  it("parses zalo and phone from free-text kakaoLink", () => {
    const chips = buildCrawlContactChips({
      kakaoLink: "Juliehome16 (Zalo: 0904496967)",
    });
    expect(chips.some((c) => c.kind === "zalo")).toBe(true);
  });

  it("extracts phone numbers from post body", () => {
    const phones = extractPhones("📞 타오디엔 직통 번호: 0775926410");
    expect(phones[0]).toBe("0775926410");
  });

  it("infers contact from content when kakaoLink is empty", () => {
    const line = inferContactLine({
      content: "문의 Tel: 0342058402",
      sourceName: "대박호치민",
    });
    expect(line).toContain("034 205 8402");
  });

  it("falls back to 단톡방 닉 when no contact found", () => {
    expect(
      inferContactLine({ sourceName: "코코파인", content: "조언 부탁드립니다." })
    ).toBe("단톡방 닉: 코코파인");
  });

  it("returns no chips when kakaoLink is explicitly null (scam report)", () => {
    const chips = buildCrawlContactChips({
      kakaoLink: null,
      content: "잘로 검색용 텍스트 키워드: j_a_s_o_n",
      sourceName: "교민제보방",
    });
    expect(chips).toHaveLength(0);
  });
});
