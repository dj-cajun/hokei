import { describe, expect, it } from "vitest";
import { isPremiumPartnerOwner } from "./is-premium-partner-owner";

describe("isPremiumPartnerOwner", () => {
  const ids = new Set(["owner-premium"]);

  it("returns true for premium owner id", () => {
    expect(isPremiumPartnerOwner("owner-premium", ids)).toBe(true);
  });

  it("returns false for other users", () => {
    expect(isPremiumPartnerOwner("other", ids)).toBe(false);
    expect(isPremiumPartnerOwner(null, ids)).toBe(false);
    expect(isPremiumPartnerOwner(undefined, ids)).toBe(false);
  });
});
