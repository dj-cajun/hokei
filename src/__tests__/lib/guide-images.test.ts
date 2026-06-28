import { describe, expect, it } from "vitest";
import {
  normalizeLifeGuideImageUrls,
  toLifeGuideImageFields,
} from "@/lib/life/guide-images";

describe("guide-images", () => {
  it("falls back to imageUrl when imageUrls empty", () => {
    expect(normalizeLifeGuideImageUrls({ imageUrl: "https://a.com/1.jpg" })).toEqual([
      "https://a.com/1.jpg",
    ]);
  });

  it("uses imageUrls array when present", () => {
    expect(
      normalizeLifeGuideImageUrls({
        imageUrl: "https://a.com/1.jpg",
        imageUrls: ["https://a.com/1.jpg", "https://a.com/2.jpg"],
      })
    ).toEqual(["https://a.com/1.jpg", "https://a.com/2.jpg"]);
  });

  it("stores multiple urls in imageUrls field", () => {
    const fields = toLifeGuideImageFields([
      "https://a.com/1.jpg",
      "https://a.com/2.jpg",
    ]);
    expect(fields.imageUrl).toBe("https://a.com/1.jpg");
    expect(fields.imageUrls).toEqual([
      "https://a.com/1.jpg",
      "https://a.com/2.jpg",
    ]);
  });

  it("single image only sets imageUrl", () => {
    const fields = toLifeGuideImageFields(["https://a.com/1.jpg"]);
    expect(fields.imageUrl).toBe("https://a.com/1.jpg");
    expect(fields.imageUrls).toBeUndefined();
  });
});
