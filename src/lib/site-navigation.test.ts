import { describe, expect, it } from "vitest";
import { staticCategoryTree } from "@/lib/category-static-params";
import {
  buildHeaderNavSections,
  buildLifeInfoHub,
  buildSiteNavGroups,
  lifeInfoHubDropdownItems,
  resolveActiveHeaderSectionSlug,
} from "@/lib/site-navigation";

describe("site-navigation", () => {
  const tree = staticCategoryTree();

  it("groups info before life-info and community", () => {
    const groups = buildSiteNavGroups(tree);
    expect(groups.map((g) => g.id)).toEqual(["info", "life-info", "community"]);
    expect(groups[1]?.items.some((i) => i.slug === "life-info")).toBe(true);
  });

  it("builds 3-tier promo under life-info", () => {
    const hub = buildLifeInfoHub(tree);
    const hereHow = hub?.children.find((c) => c.slug === "promo-store");
    expect(hereHow?.label).toBe("여기 어때");
    expect(hereHow?.children.map((c) => c.label)).toEqual([
      "배고플때",
      "불편할때",
    ]);
    const realEstate = hub?.children.find((c) => c.slug === "real-estate");
    expect(realEstate?.children.length).toBeGreaterThan(0);
  });

  it("life-info dropdown shows hub + mid parents only", () => {
    const hub = buildLifeInfoHub(tree)!;
    const items = lifeInfoHubDropdownItems(hub);
    expect(items.map((i) => i.label)).toEqual([
      "전체",
      "여기 어때",
      "부동산 & 단기 임대",
      "중고 거래",
      "취업 & 비즈니스",
    ]);
    expect(items.some((i) => i.href.includes("/hungry"))).toBe(false);
    expect(items.some((i) => i.label === "구인")).toBe(false);
  });

  it("resolves one active header tab from pathname", () => {
    const nav = buildHeaderNavSections(tree);
    expect(resolveActiveHeaderSectionSlug("/news/visa-residency", nav)).toBe(
      "news"
    );
    expect(resolveActiveHeaderSectionSlug("/jobs/hiring", nav)).toBe(
      "life-info"
    );
    expect(resolveActiveHeaderSectionSlug("/community/free-board", nav)).toBe(
      "community"
    );
    expect(resolveActiveHeaderSectionSlug("/life/study", nav)).toBe("life");
  });

  it("hides life-info sections from top-level header tabs", () => {
    const nav = buildHeaderNavSections(tree);
    expect(nav.some((s) => s.slug === "life-info")).toBe(true);
    expect(nav.some((s) => s.slug === "promo")).toBe(false);
  });
});
