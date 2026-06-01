import { describe, expect, it } from "vitest";
import { formatDateLabel, isTodayInHoChiMinh } from "@/lib/format/date";

describe("format/date", () => {
  it("formatDateLabel returns YYYY-MM-DD", () => {
    const d = new Date("2026-06-01T12:00:00Z");
    expect(formatDateLabel(d)).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("isTodayInHoChiMinh true for now", () => {
    expect(isTodayInHoChiMinh(new Date())).toBe(true);
  });
});
