import { describe, expect, it } from "vitest";
import { resolveHomeYouTubeHighlight } from "@/lib/site-settings";

describe("resolveHomeYouTubeHighlight", () => {
  it("parses stored youtube url", () => {
    const result = resolveHomeYouTubeHighlight(
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=30"
    );
    expect(result.videoId).toBe("dQw4w9WgXcQ");
    expect(result.startSeconds).toBe(30);
    expect(result.source).toBe("db");
  });

  it("falls back to default when url invalid", () => {
    const result = resolveHomeYouTubeHighlight("https://example.com");
    expect(result.source).toBe("default");
    expect(result.videoId).toBe("d-fY16xMeT4");
  });
});
