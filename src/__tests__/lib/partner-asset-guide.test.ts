import { describe, expect, it } from "vitest";
import {
  resolvePartnerMediaAbsoluteUrl,
  resolvePartnerOgImageUrl,
} from "@/lib/partner/asset-guide";

describe("resolvePartnerOgImageUrl", () => {
  const site = "https://www.hokei.vn";

  it("prefers ogImageUrl over thumbnail", () => {
    expect(
      resolvePartnerOgImageUrl(
        {
          ogImageUrl: "/partners/og.jpg",
          thumbnail: "/partners/thumb.jpg",
        },
        site
      )
    ).toBe("https://www.hokei.vn/partners/og.jpg");
  });

  it("falls back to thumbnail", () => {
    expect(
      resolvePartnerOgImageUrl({ ogImageUrl: null, thumbnail: "/partners/t.jpg" }, site)
    ).toBe("https://www.hokei.vn/partners/t.jpg");
  });

  it("accepts https blob urls", () => {
    const blob = "https://blob.vercel-storage.com/x.jpg";
    expect(resolvePartnerMediaAbsoluteUrl(blob, site)).toBe(blob);
  });
});
