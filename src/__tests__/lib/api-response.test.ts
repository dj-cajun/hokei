import { describe, expect, it } from "vitest";
import { parseApiError } from "@/lib/api-response";

describe("parseApiError", () => {
  it("reads error string from api payload", () => {
    expect(parseApiError({ ok: false, error: "실패" })).toBe("실패");
  });

  it("returns undefined for success payload", () => {
    expect(parseApiError({ ok: true, id: "x" })).toBeUndefined();
  });
});
