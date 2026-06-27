import { describe, expect, it } from "vitest";
import { partnerStoreToPrismaData } from "./admin-map";

describe("partnerStoreToPrismaData", () => {
  it("sets publishedAt when status is PUBLISHED", () => {
    const data = partnerStoreToPrismaData({
      name: "Test BBQ",
      slug: "test-bbq",
      category: "FOOD",
      status: "PUBLISHED",
    });

    expect(data.status).toBe("PUBLISHED");
    expect(data.publishedAt).toBeInstanceOf(Date);
    expect(data.phone).toBeNull();
  });

  it("clears empty optional strings", () => {
    const data = partnerStoreToPrismaData({
      name: "Shop",
      slug: "shop",
      category: "OTHER",
      phone: "  ",
      kakaoLink: "",
    });

    expect(data.phone).toBeNull();
    expect(data.kakaoLink).toBeNull();
  });
});
