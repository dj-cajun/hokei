import { describe, expect, it } from "vitest";
import {
  aggregateSkipReasons,
  parseIngestErrorDetails,
  parseSkipReasonFromMessage,
} from "@/lib/news/ingest-skip-stats";

describe("ingest-skip-stats", () => {
  it("parses skip reason from message", () => {
    expect(
      parseSkipReasonFromMessage(
        "https://example.com: [extract_short] 본문 12자 — 저장 안 함"
      )
    ).toBe("extract_short");
  });

  it("aggregates skip reasons", () => {
    const stats = aggregateSkipReasons([
      "https://a.com: [extract_short] 본문 0자",
      "https://b.com: [fetch_timeout] 본문 0자",
      "https://c.com: [extract_short] 본문 5자",
    ]);
    expect(stats).toEqual({ extract_short: 2, fetch_timeout: 1 });
  });

  it("parses errorDetails JSON with skipStats", () => {
    const parsed = parseIngestErrorDetails(
      JSON.stringify({
        skipStats: { extract_short: 3 },
        issues: [{ message: "x" }],
      })
    );
    expect(parsed?.skipStats?.extract_short).toBe(3);
  });
});
