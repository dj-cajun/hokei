import { describe, expect, it } from "vitest";
import { ipMatchesPattern } from "@/lib/admin/ip-block-patterns";

describe("ipMatchesPattern", () => {
  it("matches exact IP", () => {
    expect(ipMatchesPattern("203.0.113.50", "203.0.113.50")).toBe(true);
    expect(ipMatchesPattern("203.0.113.51", "203.0.113.50")).toBe(false);
  });

  it("matches prefix ending with dot", () => {
    expect(ipMatchesPattern("203.0.113.50", "203.0.113.")).toBe(true);
    expect(ipMatchesPattern("203.0.114.1", "203.0.113.")).toBe(false);
  });

  it("matches wildcard suffix", () => {
    expect(ipMatchesPattern("10.0.0.5", "10.0.0.*")).toBe(true);
  });
});
