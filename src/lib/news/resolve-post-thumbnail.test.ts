import { describe, expect, it } from "vitest";
import { isFallbackThumbnailUrl } from "@/lib/news/resolve-post-thumbnail";

describe("resolve-post-thumbnail policy helpers", () => {
  it("detects static and legacy unsplash fallbacks", () => {
    expect(isFallbackThumbnailUrl("/news/fallback/korea.jpg")).toBe(true);
    expect(
      isFallbackThumbnailUrl(
        "https://images.unsplash.com/photo-1583417319070-4a5401d0a8e9?w=400"
      )
    ).toBe(true);
    expect(isFallbackThumbnailUrl("https://cdn.example.com/a.jpg")).toBe(
      false
    );
  });
});
