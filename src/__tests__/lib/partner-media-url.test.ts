import { describe, expect, it } from "vitest";
import {
  isValidOptionalPartnerMediaUrl,
  isValidPartnerMediaUrl,
} from "@/lib/partner/media-url";

describe("isValidPartnerMediaUrl", () => {
  it("accepts https blob URLs", () => {
    expect(
      isValidPartnerMediaUrl("https://example.blob.vercel-storage.com/a.jpg")
    ).toBe(true);
  });

  it("accepts /partners/ static paths", () => {
    expect(isValidPartnerMediaUrl("/partners/2d-sketch-cafe-banner.svg")).toBe(
      true
    );
  });

  it("rejects protocol-relative URLs", () => {
    expect(isValidPartnerMediaUrl("//evil.example/x.png")).toBe(false);
  });

  it("rejects arbitrary site paths", () => {
    expect(isValidPartnerMediaUrl("/api/admin/users")).toBe(false);
  });

  it("rejects path traversal", () => {
    expect(isValidPartnerMediaUrl("/partners/../etc/passwd")).toBe(false);
  });
});

describe("isValidOptionalPartnerMediaUrl", () => {
  it("allows empty string", () => {
    expect(isValidOptionalPartnerMediaUrl("")).toBe(true);
  });
});
