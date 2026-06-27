import { describe, expect, it } from "vitest";
import { partnerStoreOwnerToPrismaData } from "@/lib/partner/owner";

describe("partnerStoreOwnerToPrismaData", () => {
  it("LP 텍스트 필드를 nullIfEmpty로 매핑", () => {
    const data = partnerStoreOwnerToPrismaData({
      introText: "  소개  ",
      menuText: "",
      locationTips: "Grab 검색 팁",
      hoursText: "09:00–22:00",
    });
    expect(data).toEqual({
      introText: "소개",
      menuText: null,
      locationTips: "Grab 검색 팁",
      hoursText: "09:00–22:00",
    });
  });
});
