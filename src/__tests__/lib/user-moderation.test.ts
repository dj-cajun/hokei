import { describe, expect, it } from "vitest";
import {
  USER_SUSPENDED_MESSAGE,
  USER_WRITE_BANNED_MESSAGE,
} from "@/lib/user-moderation";

describe("user-moderation messages", () => {
  it("exposes stable user-facing copy", () => {
    expect(USER_SUSPENDED_MESSAGE).toContain("정지");
    expect(USER_WRITE_BANNED_MESSAGE).toContain("글쓰기");
  });
});
