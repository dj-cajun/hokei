import { describe, expect, it } from "vitest";
import { normalizePartnerBannerImageSrc } from "@/lib/partner/banner-image-src";

describe("normalizePartnerBannerImageSrc", () => {
  it("converts hokei.vn absolute URL to path", () => {
    expect(
      normalizePartnerBannerImageSrc(
        "https://www.hokei.vn/icons/hokei-icon-512.png"
      )
    ).toBe("/icons/hokei-icon-512.png");
  });

  it("keeps relative paths", () => {
    expect(normalizePartnerBannerImageSrc("/partners/demo.jpg")).toBe(
      "/partners/demo.jpg"
    );
  });

  it("keeps external blob URLs", () => {
    const blob =
      "https://abc.public.blob.vercel-storage.com/banner-abc123.jpg";
    expect(normalizePartnerBannerImageSrc(blob)).toBe(blob);
  });
});
