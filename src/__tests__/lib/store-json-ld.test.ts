import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/site-url", () => ({
  resolveSiteUrl: () => "https://www.hokei.vn",
}));

import { buildLocalBusinessJsonLd } from "@/lib/partner/store-json-ld";

describe("buildLocalBusinessJsonLd", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("LocalBusiness 필수 필드와 연락처·주소를 포함", () => {
    const data = buildLocalBusinessJsonLd({
      slug: "saigon-bbq",
      name: "사이공 BBQ",
      tagline: "1군 한식",
      introText: "한 줄 소개",
      phone: "+84 90 123 4567",
      address: "District 1, HCMC",
      thumbnail: "/partners/demo.png",
    });

    expect(data).toMatchObject({
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      name: "사이공 BBQ",
      url: "https://www.hokei.vn/store/saigon-bbq",
      description: "한 줄 소개",
      telephone: "+84 90 123 4567",
      image: "https://www.hokei.vn/partners/demo.png",
      address: {
        "@type": "PostalAddress",
        streetAddress: "District 1, HCMC",
        addressCountry: "VN",
      },
    });
  });
});
