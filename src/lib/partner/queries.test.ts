import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  getPartnerStoreBySlug,
  listPublishedPartners,
  publishedPartnerWhere,
} from "./queries";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    partnerStore: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}));

describe("publishedPartnerWhere", () => {
  it("includes published status and expiry guard", () => {
    const now = new Date("2026-06-21T00:00:00Z");
    expect(publishedPartnerWhere(now)).toEqual({
      status: "PUBLISHED",
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    });
  });
});

describe("getPartnerStoreBySlug", () => {
  beforeEach(() => {
    vi.mocked(prisma.partnerStore.findFirst).mockReset();
  });

  it("queries published store by slug", async () => {
    vi.mocked(prisma.partnerStore.findFirst).mockResolvedValue({
      id: "c1",
      slug: "saigon-bbq",
    } as never);

    const store = await getPartnerStoreBySlug("saigon-bbq");

    expect(store?.slug).toBe("saigon-bbq");
    expect(prisma.partnerStore.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ slug: "saigon-bbq", status: "PUBLISHED" }),
      })
    );
  });

  it("returns null for blank slug", async () => {
    expect(await getPartnerStoreBySlug("  ")).toBeNull();
    expect(prisma.partnerStore.findFirst).not.toHaveBeenCalled();
  });
});

describe("listPublishedPartners", () => {
  beforeEach(() => {
    vi.mocked(prisma.partnerStore.findMany).mockReset();
  });

  it("lists with default limit", async () => {
    vi.mocked(prisma.partnerStore.findMany).mockResolvedValue([]);

    await listPublishedPartners();

    expect(prisma.partnerStore.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 48 })
    );
  });
});
