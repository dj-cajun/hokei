import { describe, expect, it } from "vitest";
import { mapPostComments } from "@/lib/map-post-comments";

describe("mapPostComments", () => {
  it("maps guest and member authors", () => {
    const mapped = mapPostComments(
      [
        {
          id: "c1",
          content: "안녕",
          createdAt: new Date("2026-01-01T00:00:00Z"),
          authorId: "u1",
          guestName: null,
          guestPasswordHash: null,
          author: { name: "홍길동" },
        },
        {
          id: "c2",
          content: "비회원",
          createdAt: new Date("2026-01-02T00:00:00Z"),
          authorId: null,
          guestName: "익명2",
          guestPasswordHash: "hash",
          author: null,
        },
      ],
      "u1",
      false
    );

    expect(mapped[0]!.authorName).toBe("홍길동");
    expect(mapped[0]!.isOwner).toBe(true);
    expect(mapped[1]!.authorName).toBe("익명2");
    expect(mapped[1]!.isGuestComment).toBe(true);
    expect(mapped[1]!.isOwner).toBe(false);
  });

  it("grants admin edit on all comments", () => {
    const mapped = mapPostComments(
      [
        {
          id: "c1",
          content: "x",
          createdAt: new Date(),
          authorId: "other",
          guestName: null,
          guestPasswordHash: null,
          author: { name: "A" },
        },
      ],
      undefined,
      true
    );
    expect(mapped[0]!.isOwner).toBe(true);
  });
});
