import { describe, expect, it } from "vitest";
import {
  isLikelyNewsCdnImageUrl,
  isPlausibleStoredThumbnailUrl,
} from "@/lib/news/image";
import { getThumbnailDisplayUrl } from "@/lib/news/thumbnail-display";

describe("news thumbnail display", () => {
  it("proxies VnExpress CDN through API", () => {
    const url =
      "https://i1-english.vnecdn.net/2026/06/08/photo.jpg?w=680";
    expect(isLikelyNewsCdnImageUrl(url)).toBe(true);
    expect(isPlausibleStoredThumbnailUrl(url)).toBe(false);
    expect(getThumbnailDisplayUrl(url, "https://e.vnexpress.net/a.html")).toContain(
      "/api/news/thumbnail?"
    );
  });

  it("proxies InsideVina CDN through API", () => {
    const url = "https://cdn.insidevina.com/news/photo/202606/43357.jpg";
    expect(isPlausibleStoredThumbnailUrl(url)).toBe(true);
    expect(getThumbnailDisplayUrl(url)).toContain("/api/news/thumbnail?");
  });

  it("proxies Vercel Blob through API", () => {
    const url =
      "https://abc.public.blob.vercel-storage.com/news/thumbnails/x.jpg";
    expect(getThumbnailDisplayUrl(url, undefined, "KOREA")).toContain(
      "/api/news/thumbnail?"
    );
  });

  it("uses static fallback for legacy unsplash URLs", () => {
    const url =
      "https://images.unsplash.com/photo-1583417319070-4a5401d0a8e9?w=400";
    expect(getThumbnailDisplayUrl(url, undefined, "KOREA")).toBe(
      "/news/fallback/korea.jpg"
    );
  });

  it("returns topic static fallback when thumbnail missing", () => {
    const url = getThumbnailDisplayUrl(null, undefined, "VIETNAM_POLICY");
    expect(url).toBe("/news/fallback/vietnam-policy.jpg");
  });

  it("rejects logos and placeholders for storage", () => {
    expect(
      isPlausibleStoredThumbnailUrl(
        "https://cdn.insidevina.com/image/logo/toplogo.png"
      )
    ).toBe(false);
  });
});
