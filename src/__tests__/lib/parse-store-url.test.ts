import { describe, expect, it } from "vitest";
import { parsePartnerStoreSlugFromInput } from "@/lib/partner/parse-store-url";

describe("parsePartnerStoreSlugFromInput", () => {
  it("parses full store URL", () => {
    expect(
      parsePartnerStoreSlugFromInput("https://www.hokei.vn/store/2d-sketch-cafe")
    ).toBe("2d-sketch-cafe");
  });

  it("parses path and bare slug", () => {
    expect(parsePartnerStoreSlugFromInput("/store/demo-cafe")).toBe("demo-cafe");
    expect(parsePartnerStoreSlugFromInput("demo-cafe")).toBe("demo-cafe");
  });

  it("rejects invalid input", () => {
    expect(parsePartnerStoreSlugFromInput("https://example.com/foo")).toBeNull();
    expect(parsePartnerStoreSlugFromInput("")).toBeNull();
  });
});
