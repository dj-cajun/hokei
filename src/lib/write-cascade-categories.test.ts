import { describe, expect, it } from "vitest";
import {
  CASCADE_MID_PLACEHOLDER,
  CASCADE_SUB_PLACEHOLDER,
  getMidOptions,
  getSubOptions,
  resolveMidFromCategorySlug,
} from "@/lib/write-cascade-categories";

describe("write-cascade-categories", () => {
  it("exposes board-aligned mid options", () => {
    expect(getMidOptions("취업")).toEqual(["구인", "구직"]);
    expect(getMidOptions("중고거래")).toEqual(["팝니다", "삽니다"]);
    expect(getMidOptions("부동산")).toEqual([
      "임차인 구합니다",
      "임대인 구합니다",
    ]);
    expect(getMidOptions("여기어때")).toEqual(["배고플때", "불편할때"]);
  });

  it("exposes practical sub options per mid", () => {
    expect(getSubOptions("중고거래", "팝니다")).toContain("오토바이·차량");
    expect(getSubOptions("부동산", "임차인 구합니다")).toContain(
      "단기·한달살기"
    );
    expect(getSubOptions("취업", "구인")).toContain("풀타임");
  });

  it("resolves mid from db slug", () => {
    expect(resolveMidFromCategorySlug("jobs", "jobs-hiring")).toBe("구인");
    expect(resolveMidFromCategorySlug("classifieds", "classifieds-buying")).toBe(
      "삽니다"
    );
    expect(
      resolveMidFromCategorySlug("real-estate", "real-estate-landlord-seeking")
    ).toBe("임대인 구합니다");
  });

  it("has section-specific placeholders", () => {
    expect(CASCADE_MID_PLACEHOLDER.취업).toContain("구인");
    expect(CASCADE_SUB_PLACEHOLDER.중고거래).toBe("품목");
  });
});
