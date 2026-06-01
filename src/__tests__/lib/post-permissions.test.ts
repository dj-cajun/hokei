import { describe, expect, it, vi } from "vitest";

vi.mock("@/auth", () => ({
  auth: vi.fn(async () => null),
}));

import {
  hashGuestPassword,
  isCommentOwner,
  isPostOwner,
  verifyGuestPassword,
} from "@/lib/post-permissions";

describe("post-permissions", () => {
  it("isPostOwner matches author", () => {
    expect(isPostOwner({ authorId: "u1", guestPasswordHash: null, isAutomated: false }, "u1")).toBe(true);
    expect(isPostOwner({ authorId: "u1", guestPasswordHash: null, isAutomated: false }, "u2")).toBe(false);
  });

  it("isCommentOwner matches author", () => {
    expect(isCommentOwner({ authorId: "c1" }, "c1")).toBe(true);
    expect(isCommentOwner({ authorId: null }, "c1")).toBe(false);
  });

  it("verifyGuestPassword round-trip", async () => {
    const hash = await hashGuestPassword("secret12");
    expect(await verifyGuestPassword("secret12", hash)).toBe(true);
    expect(await verifyGuestPassword("wrong", hash)).toBe(false);
  });
});
