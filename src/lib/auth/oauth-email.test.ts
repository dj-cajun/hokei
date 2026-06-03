import { describe, expect, it } from "vitest";
import { isSocialPlaceholderEmail } from "@/lib/auth/oauth-email";

describe("isSocialPlaceholderEmail", () => {
  it("detects kakao placeholder emails", () => {
    expect(isSocialPlaceholderEmail("kakao_123@users.hokei.local")).toBe(true);
    expect(isSocialPlaceholderEmail("user@gmail.com")).toBe(false);
  });
});
