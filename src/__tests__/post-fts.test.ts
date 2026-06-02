import { describe, expect, it } from "vitest";
import {
  buildFtsMatchQuery,
  isSafeFtsMatchQuery,
} from "@/lib/search/fts-match-query";

describe("post-fts", () => {
  it("buildFtsMatchQuery produces safe match strings", () => {
    const match = buildFtsMatchQuery("호치민 여행");
    expect(match).toBe('"호치민" AND "여행"');
    expect(isSafeFtsMatchQuery(match!)).toBe(true);
  });

  it("rejects injection-like match strings", () => {
    expect(isSafeFtsMatchQuery(`"a" OR 1=1--`)).toBe(false);
    expect(isSafeFtsMatchQuery("'; DROP TABLE post_fts;--")).toBe(false);
  });
});
