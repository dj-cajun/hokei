import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/partner/queries", () => ({
  getPartnerStoreByOwnerId: vi.fn(),
}));

import { getPartnerStoreByOwnerId } from "@/lib/partner/queries";
import { assertPartnerOwnerPromoStoreName } from "@/lib/partner/promo-post-write";

describe("assertPartnerOwnerPromoStoreName", () => {
  beforeEach(() => {
    vi.mocked(getPartnerStoreByOwnerId).mockReset();
  });

  it("allows admin to post any store name", async () => {
    vi.mocked(getPartnerStoreByOwnerId).mockResolvedValue({
      name: "My Cafe",
    } as never);

    const result = await assertPartnerOwnerPromoStoreName(
      "owner-1",
      "ADMIN",
      "Other Store"
    );
    expect(result).toEqual({ ok: true });
  });

  it("requires owner store name for partner owners", async () => {
    vi.mocked(getPartnerStoreByOwnerId).mockResolvedValue({
      name: "2D SKETCH CAFE",
    } as never);

    await expect(
      assertPartnerOwnerPromoStoreName("owner-1", "USER", "Other Store")
    ).resolves.toEqual({
      ok: false,
      message: "제휴 업소 사장님은 본인 업소명으로만 홍보 글을 등록할 수 있습니다.",
    });

    await expect(
      assertPartnerOwnerPromoStoreName("owner-1", "USER", "2D SKETCH CAFE")
    ).resolves.toEqual({ ok: true });
  });
});
