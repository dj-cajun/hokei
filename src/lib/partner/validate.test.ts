import { describe, expect, it } from "vitest";
import {
  isValidMapsUrl,
  isValidPartnerPhone,
  partnerStoreCreateSchema,
} from "./validate";

describe("isValidMapsUrl", () => {
  it("accepts Google Maps URLs", () => {
    expect(
      isValidMapsUrl("https://maps.google.com/?q=10.77,106.70")
    ).toBe(true);
    expect(
      isValidMapsUrl("https://www.google.com/maps/place/Ho+Chi+Minh")
    ).toBe(true);
    expect(isValidMapsUrl("https://goo.gl/maps/abc123")).toBe(true);
  });

  it("rejects non-maps URLs", () => {
    expect(isValidMapsUrl("http://maps.google.com/x")).toBe(false);
    expect(isValidMapsUrl("https://example.com/maps")).toBe(false);
  });
});

describe("isValidPartnerPhone", () => {
  it("accepts common phone formats", () => {
    expect(isValidPartnerPhone("+84 90 123 4567")).toBe(true);
    expect(isValidPartnerPhone("090-123-4567")).toBe(true);
  });

  it("rejects too short values", () => {
    expect(isValidPartnerPhone("123")).toBe(false);
  });
});

describe("partnerStoreCreateSchema", () => {
  it("parses minimal valid payload", () => {
    const parsed = partnerStoreCreateSchema.parse({
      name: "Saigon BBQ",
      slug: "saigon-bbq",
      category: "FOOD",
      kakaoLink: "https://pf.kakao.com/_xbxhTG/chat",
    });
    expect(parsed.plan).toBe("BASIC");
    expect(parsed.status).toBe("DRAFT");
  });

  it("rejects invalid kakao link", () => {
    expect(() =>
      partnerStoreCreateSchema.parse({
        name: "Test",
        slug: "test-store",
        category: "FOOD",
        kakaoLink: "https://evil.example/chat",
      })
    ).toThrow();
  });

  it("rejects non-partners local thumbnail paths", () => {
    expect(() =>
      partnerStoreCreateSchema.parse({
        name: "Test",
        slug: "test-store",
        category: "FOOD",
        thumbnail: "//evil.example/x.png",
      })
    ).toThrow();
  });
});
