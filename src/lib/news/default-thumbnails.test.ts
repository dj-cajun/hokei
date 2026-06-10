import { describe, expect, it } from "vitest";
import { existsSync } from "fs";
import { join } from "path";
import {
  getFallbackThumbnail,
  getStaticFallbackFilePath,
  isFallbackThumbnailUrl,
  isStaticFallbackThumbnailPath,
} from "@/lib/news/default-thumbnails";
import { getThumbnailDisplayUrl } from "@/lib/news/thumbnail-display";
import { readStaticFallbackBytes } from "@/lib/news/static-fallback-bytes";

describe("default-thumbnails", () => {
  it("uses same-origin static paths per topic", () => {
    expect(getFallbackThumbnail("KOREA")).toBe("/news/fallback/korea.jpg");
    expect(getFallbackThumbnail("VIETNAM_POLICY")).toBe(
      "/news/fallback/vietnam-policy.jpg"
    );
  });

  it("static fallback files exist on disk", () => {
    for (const topic of [
      "KOREA",
      "TRAVEL",
      "VIETNAM_POLICY",
      "TOURIST",
    ] as const) {
      const path = join(process.cwd(), getStaticFallbackFilePath(topic));
      expect(existsSync(path), path).toBe(true);
      const bytes = readStaticFallbackBytes(topic);
      expect(bytes?.body.byteLength).toBeGreaterThan(200);
    }
  });

  it("treats legacy unsplash and static paths as fallback", () => {
    expect(isFallbackThumbnailUrl("/news/fallback/korea.jpg")).toBe(true);
    expect(
      isFallbackThumbnailUrl(
        "https://images.unsplash.com/photo-1528183429752-a97d0bf99f60"
      )
    ).toBe(true);
    expect(isFallbackThumbnailUrl("https://cdn.example.com/a.jpg")).toBe(false);
  });

  it("maps legacy unsplash in DB to static fallback for display", () => {
    const legacy =
      "https://images.unsplash.com/photo-1528183429752-a97d0bf99f60?w=400";
    expect(getThumbnailDisplayUrl(legacy, undefined, "VIETNAM_POLICY")).toBe(
      "/news/fallback/vietnam-policy.jpg"
    );
  });

  it("never returns external https to the browser", () => {
    const display = getThumbnailDisplayUrl(
      "https://cdn.insidevina.com/news/photo/x.jpg",
      "https://www.insidevina.com/a.html",
      "KOREA"
    );
    expect(display.startsWith("/api/news/thumbnail")).toBe(true);
    expect(isStaticFallbackThumbnailPath(display)).toBe(false);
  });
});
