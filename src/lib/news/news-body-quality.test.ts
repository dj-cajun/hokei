import { describe, expect, it } from "vitest";
import {
  hasSubstantialNewsBody,
  NEWS_MIN_BODY_LENGTH,
} from "@/lib/news/news-body-quality";

describe("hasSubstantialNewsBody", () => {
  it("rejects null and short text", () => {
    expect(hasSubstantialNewsBody(null)).toBe(false);
    expect(hasSubstantialNewsBody("   ")).toBe(false);
    expect(hasSubstantialNewsBody("a".repeat(NEWS_MIN_BODY_LENGTH - 1))).toBe(
      false
    );
  });

  it("accepts text at minimum length", () => {
    expect(hasSubstantialNewsBody("가".repeat(NEWS_MIN_BODY_LENGTH))).toBe(true);
  });
});
