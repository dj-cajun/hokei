import { describe, expect, it } from "vitest";
import {
  COMMENT_MAX_LENGTH,
  GUEST_PASSWORD_MIN_LENGTH,
  MAX_IMAGE_BYTES,
  SEARCH_MIN_QUERY_LENGTH,
} from "@/lib/constants";

describe("constants", () => {
  it("keeps sensible bounds", () => {
    expect(SEARCH_MIN_QUERY_LENGTH).toBeGreaterThanOrEqual(2);
    expect(COMMENT_MAX_LENGTH).toBeGreaterThan(100);
    expect(GUEST_PASSWORD_MIN_LENGTH).toBeGreaterThanOrEqual(4);
    expect(MAX_IMAGE_BYTES).toBe(8 * 1024 * 1024);
  });
});
