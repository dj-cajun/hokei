import { describe, expect, it } from "vitest";
import { storeIntroBody, storeTaglineDisplay } from "@/lib/partner/store-copy";

describe("store-copy", () => {
  it("introText 우선, description에서 주소 줄 제거", () => {
    const intro = storeIntroBody({
      introText: "한 줄 소개",
      description: "본문\n📍 74 Nguyễn Cư Trinh",
      address: "74 Nguyễn Cư Trinh",
    });
    expect(intro).toBe("한 줄 소개");
  });

  it("tagline이 intro와 겹치면 숨김", () => {
    const tag = storeTaglineDisplay({
      tagline: "부이비엔 1분",
      introText: "부이비엔 1분 거리 카페",
    });
    expect(tag).toBeNull();
  });
});
