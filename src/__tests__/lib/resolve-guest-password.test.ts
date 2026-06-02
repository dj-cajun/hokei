import { describe, expect, it } from "vitest";
import type { CommentItem } from "@/components/posts/comment-types";
import { resolveGuestPasswordForComment } from "@/components/posts/comment-parts/resolve-guest-password";

const base: CommentItem = {
  id: "1",
  content: "hi",
  createdAt: new Date().toISOString(),
  authorName: "guest",
  isOwner: false,
  isGuestComment: true,
};

describe("resolveGuestPasswordForComment", () => {
  it("skips password for logged-in owner", () => {
    const comment = { ...base, isOwner: true, isGuestComment: false };
    expect(resolveGuestPasswordForComment(comment, "")).toEqual({
      ok: true,
      password: "",
    });
  });

  it("requires password for guest comment", () => {
    expect(resolveGuestPasswordForComment(base, "")).toEqual({
      ok: false,
      message: "비밀번호를 입력해 주세요.",
    });
  });
});
