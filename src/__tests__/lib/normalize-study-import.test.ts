import { describe, expect, it } from "vitest";
import {
  extractStudyVnText,
  normalizeKakaoEduRow,
  slugFromStudyPublishedAt,
} from "@/lib/life/normalize-study-import";

describe("normalize-study-import", () => {
  it("builds stable slug from publishedAt", () => {
    expect(slugFromStudyPublishedAt("2025-09-16T06:00:00Z")).toBe(
      "vietnameseselfstudy-20250916060000"
    );
  });

  it("extracts vnText from news lesson body", () => {
    const vn = extractStudyVnText(
      "[뉴스로 보는 베트남어]\nLotte sắp xây đại siêu thị tại Thái Nguyên\nLotte = 롯데"
    );
    expect(vn).toBe("Lotte sắp xây đại siêu thị tại Thái Nguyên");
  });

  it("normalizes edu row to LifeGuide fields", () => {
    const row = normalizeKakaoEduRow({
      title: "[베트남어독학방] 뉴스로 보는 베트남어",
      sourceLink: "https://example.com/news",
      content: "[뉴스로 보는 베트남어]\nXin chào\n= 안녕",
      publishedAt: "2025-09-16T06:00:00Z",
    });
    expect(row.domain).toBe("STUDY");
    expect(row.kind).toBe("PHRASE");
    expect(row.sourceLabel).toBe("베트남어 독학");
    expect(row.externalUrl).toBe("https://example.com/news");
    expect(row.vnText).toBe("Xin chào");
  });
});
