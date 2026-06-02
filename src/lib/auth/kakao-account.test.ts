import { describe, expect, it } from "vitest";
import { isSocialPlaceholderEmail } from "@/lib/auth/oauth-email";

describe("kakao account linking", () => {
  it("detects placeholder emails", () => {
    expect(isSocialPlaceholderEmail("kakao_123@users.hokei.local")).toBe(
      true
    );
    expect(isSocialPlaceholderEmail("user@gmail.com")).toBe(false);
  });
});
