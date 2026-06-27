import { describe, expect, it, vi, beforeEach } from "vitest";
import { assertCommentPostIdForStore } from "@/lib/partner/comment-post";

vi.mock("@/lib/promo/queries", () => ({
  getPromoPostsByStore: vi.fn(),
}));

import { getPromoPostsByStore } from "@/lib/promo/queries";

describe("assertCommentPostIdForStore", () => {
  beforeEach(() => {
    vi.mocked(getPromoPostsByStore).mockReset();
  });

  it("allows null and empty", async () => {
    await expect(assertCommentPostIdForStore({ slug: "cafe", name: "Cafe" }, null)).resolves.toBe(null);
    await expect(assertCommentPostIdForStore({ slug: "cafe", name: "Cafe" }, "")).resolves.toBe(null);
  });

  it("accepts promo post id for store", async () => {
    vi.mocked(getPromoPostsByStore).mockResolvedValue({
      storeName: "Cafe",
      items: [{ id: "post-abc", title: "이벤트", summary: "", publishedAt: new Date(), thumbnail: null, isCrawl: false, kakaoLink: null }],
    });

    await expect(
      assertCommentPostIdForStore({ slug: "cafe", name: "Cafe" }, "post-abc")
    ).resolves.toBe("post-abc");
  });

  it("rejects unrelated post id", async () => {
    vi.mocked(getPromoPostsByStore).mockResolvedValue({
      storeName: "Cafe",
      items: [{ id: "post-abc", title: "이벤트", summary: "", publishedAt: new Date(), thumbnail: null, isCrawl: false, kakaoLink: null }],
    });

    const result = await assertCommentPostIdForStore(
      { slug: "cafe", name: "Cafe" },
      "other-post"
    );
    expect(result).toEqual({
      error: "해당 업소의 홍보 글만 댓글 게시글로 연결할 수 있습니다.",
    });
  });
});
