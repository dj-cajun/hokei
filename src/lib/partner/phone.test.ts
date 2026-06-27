import { describe, expect, it } from "vitest";
import { toTelHref } from "./phone";

describe("toTelHref", () => {
  it("normalizes phone for tel links", () => {
    expect(toTelHref("+84 90 123 4567")).toBe("tel:+84901234567");
    expect(toTelHref("090-123-4567")).toBe("tel:0901234567");
  });

  it("returns empty for blank input", () => {
    expect(toTelHref("  ")).toBe("");
  });
});
