import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { HomeTopBannerView } from "@/components/partner/home-top-banner";

describe("HomeTopBannerView", () => {
  it("returns null markup when banner missing", () => {
    expect(renderToStaticMarkup(<HomeTopBannerView banner={null} />)).toBe("");
  });

  it("renders aria label and image src", () => {
    const html = renderToStaticMarkup(
      <HomeTopBannerView
        banner={{
          id: "b1",
          imageUrl: "/partners/demo.jpg",
          mobileImageUrl: "/partners/demo-mobile.png",
          altText: "Demo Cafe",
          linkSlug: "demo-cafe",
          store: { slug: "demo-cafe", name: "Demo Cafe" },
        } as never}
      />
    );
    expect(html).toContain("제휴 상단 배너");
    expect(html).toContain("demo.jpg");
    expect(html).toContain("demo-mobile.png");
    expect(html).toContain('alt="Demo Cafe"');
  });
});
