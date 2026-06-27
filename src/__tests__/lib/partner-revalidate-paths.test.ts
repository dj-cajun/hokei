import { describe, expect, it } from "vitest";
import { revalidatePartnerPublicPaths } from "@/lib/partner/revalidate-paths";

const revalidatePath = vi.hoisted(() => vi.fn());

vi.mock("next/cache", () => ({
  revalidatePath,
}));

describe("revalidatePartnerPublicPaths", () => {
  it("revalidates home, partners, and store slugs", () => {
    revalidatePath.mockClear();
    revalidatePartnerPublicPaths("  ", "2d-sketch-cafe", null);
    expect(revalidatePath).toHaveBeenCalledWith("/");
    expect(revalidatePath).toHaveBeenCalledWith("/partners");
    expect(revalidatePath).toHaveBeenCalledWith("/store/2d-sketch-cafe");
    expect(revalidatePath).toHaveBeenCalledTimes(3);
  });
});
