import { describe, expect, it } from "vitest";
import {
  computeBodyAttemptBudget,
  isBodyPhasePastDeadline,
  VERCEL_BODY_PHASE_DEADLINE_MS,
  VERCEL_MAX_BODY_ATTEMPTS,
} from "@/lib/news/ingest-budget";

describe("computeBodyAttemptBudget", () => {
  it("caps Vercel attempts at VERCEL_MAX_BODY_ATTEMPTS", () => {
    expect(computeBodyAttemptBudget(50, 15, true)).toBe(
      VERCEL_MAX_BODY_ATTEMPTS
    );
  });

  it("uses remaining quota on Vercel when lower than cap", () => {
    expect(computeBodyAttemptBudget(50, 3, true)).toBe(3);
  });

  it("allows local multiplier headroom", () => {
    expect(computeBodyAttemptBudget(50, 5, false)).toBe(20);
  });

  it("returns 0 when quota exhausted", () => {
    expect(computeBodyAttemptBudget(10, 0, true)).toBe(0);
  });
});

describe("isBodyPhasePastDeadline", () => {
  it("is false before deadline on Vercel", () => {
    const start = Date.now();
    expect(isBodyPhasePastDeadline(start, start + 30_000, true)).toBe(false);
  });

  it("is true after deadline on Vercel", () => {
    const start = 1_000;
    expect(
      isBodyPhasePastDeadline(
        start,
        start + VERCEL_BODY_PHASE_DEADLINE_MS + 1,
        true
      )
    ).toBe(true);
  });

  it("never triggers locally", () => {
    const start = 1_000;
    expect(
      isBodyPhasePastDeadline(start, start + 999_999_999, false)
    ).toBe(false);
  });
});
