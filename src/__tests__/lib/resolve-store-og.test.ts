import { beforeEach, describe, expect, it, vi } from "vitest";
import { pickPartnerBannerForOg } from "@/lib/partner/banner-og-pick";
import {
  resolvePartnerBannerOgImageUrl,
  resolveStoreOgImage,
} from "@/lib/partner/resolve-store-og";
import { getActivePartnerBannerForStore } from "@/lib/partner/queries";

vi.mock("@/lib/partner/queries", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/partner/queries")>();
  return {
    ...actual,
    getActivePartnerBannerForStore: vi.fn(),
  };
});

describe("pickPartnerBannerForOg", () => {
  const now = new Date("2026-06-21T12:00:00Z");

  it("prefers wide banner slots over HOME_TOP strip", () => {
    const picked = pickPartnerBannerForOg([
      {
        slot: "HOME_TOP",
        sortOrder: 0,
        createdAt: now,
        imageUrl: "/partners/top.jpg",
      },
      {
        slot: "HOME_BOTTOM",
        sortOrder: 1,
        createdAt: now,
        imageUrl: "/partners/bottom.jpg",
      },
    ] as never);

    expect(picked?.slot).toBe("HOME_BOTTOM");
    expect(picked?.imageUrl).toBe("/partners/bottom.jpg");
  });
});

describe("resolvePartnerBannerOgImageUrl", () => {
  const site = "https://www.hokei.vn";

  it("prefers mobileImageUrl over imageUrl", () => {
    expect(
      resolvePartnerBannerOgImageUrl(
        {
          imageUrl: "/partners/pc.jpg",
          mobileImageUrl: "/partners/mobile.png",
        },
        site
      )
    ).toBe("https://www.hokei.vn/partners/mobile.png");
  });

  it("falls back to imageUrl when mobile is missing", () => {
    expect(
      resolvePartnerBannerOgImageUrl(
        { imageUrl: "/partners/pc.jpg", mobileImageUrl: null },
        site
      )
    ).toBe("https://www.hokei.vn/partners/pc.jpg");
  });
});

describe("resolveStoreOgImage", () => {
  beforeEach(() => {
    vi.mocked(getActivePartnerBannerForStore).mockReset();
  });

  it("uses mobile banner image for banner advertisers", async () => {
    vi.mocked(getActivePartnerBannerForStore).mockResolvedValue({
      imageUrl: "/partners/demo-banner.jpg",
      mobileImageUrl: "/partners/demo-banner-mobile.png",
    } as never);

    const result = await resolveStoreOgImage(
      { id: "store-1", slug: "demo-cafe" },
      "https://www.hokei.vn"
    );

    expect(result).toEqual({
      url: "https://www.hokei.vn/partners/demo-banner-mobile.png",
      isGenerated: false,
    });
  });

  it("falls back to generated name card route when no banner", async () => {
    vi.mocked(getActivePartnerBannerForStore).mockResolvedValue(null);

    const result = await resolveStoreOgImage(
      { id: "store-1", slug: "plain-store" },
      "https://www.hokei.vn"
    );

    expect(result).toEqual({
      url: "https://www.hokei.vn/store/plain-store/opengraph-image",
      isGenerated: true,
    });
  });
});
