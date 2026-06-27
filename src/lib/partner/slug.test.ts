import { describe, expect, it } from "vitest";
import {
  isValidPartnerSlug,
  resolveUniquePartnerSlug,
  slugifyPartnerName,
} from "./slug";

describe("slugifyPartnerName", () => {
  it("romanizes Latin names to kebab-case", () => {
    expect(slugifyPartnerName("Saigon BBQ")).toBe("saigon-bbq");
  });

  it("falls back when name is Korean-only", () => {
    const slug = slugifyPartnerName("막둥이네 짬뽕");
    expect(slug.length).toBeGreaterThanOrEqual(2);
  });
});

describe("isValidPartnerSlug", () => {
  it("accepts valid slugs", () => {
    expect(isValidPartnerSlug("saigon-bbq")).toBe(true);
    expect(isValidPartnerSlug("bbq2")).toBe(true);
  });

  it("rejects invalid slugs", () => {
    expect(isValidPartnerSlug("a")).toBe(false);
    expect(isValidPartnerSlug("-bad")).toBe(false);
    expect(isValidPartnerSlug("Bad")).toBe(false);
    expect(isValidPartnerSlug("bad_underscore")).toBe(false);
  });
});

describe("resolveUniquePartnerSlug", () => {
  it("adds numeric suffix on collision", async () => {
    const taken = new Set(["saigon-bbq", "saigon-bbq-2"]);
    const slug = await resolveUniquePartnerSlug("Saigon BBQ", (s) =>
      taken.has(s)
    );
    expect(slug).toBe("saigon-bbq-3");
  });
});
