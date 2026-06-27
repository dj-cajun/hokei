import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/posts", () => ({
  getPostById: vi.fn(),
}));

vi.mock("@/lib/promo/queries", () => ({
  getPromoPostsByStore: vi.fn(),
}));

import { getPostById } from "@/lib/posts";
import { getPromoPostsByStore } from "@/lib/promo/queries";
import { resolveStoreCommentPost } from "@/lib/partner/store-page";

describe("resolveStoreCommentPost", () => {
  beforeEach(() => {
    vi.mocked(getPostById).mockReset();
    vi.mocked(getPromoPostsByStore).mockReset();
  });

  it("commentPostId가 있으면 우선 사용", async () => {
    vi.mocked(getPostById).mockResolvedValue({
      id: "post-1",
      comments: [],
    } as Awaited<ReturnType<typeof getPostById>>);

    const result = await resolveStoreCommentPost({
      slug: "2d-sketch-cafe",
      name: "2D SKETCH CAFE",
      commentPostId: "post-1",
    });

    expect(result?.id).toBe("post-1");
    expect(getPromoPostsByStore).not.toHaveBeenCalled();
  });

  it("commentPostId 없으면 홍보 글 첫 건 fallback", async () => {
    vi.mocked(getPromoPostsByStore).mockResolvedValue({
      storeName: "2D SKETCH CAFE",
      items: [{ id: "promo-1" } as never],
    });
    vi.mocked(getPostById).mockResolvedValue({
      id: "promo-1",
      comments: [{ id: "c1" }],
    } as Awaited<ReturnType<typeof getPostById>>);

    const result = await resolveStoreCommentPost({
      slug: "2d-sketch-cafe",
      name: "2D SKETCH CAFE",
      commentPostId: null,
    });

    expect(result?.id).toBe("promo-1");
    expect(getPromoPostsByStore).toHaveBeenCalledWith(
      "2d-sketch-cafe",
      1,
      "2D SKETCH CAFE"
    );
  });
});
