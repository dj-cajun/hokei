import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  activePartnerBannerWhere,
  getPartnerStoreBySlug,
  listBannersForSlot,
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
    partnerBanner: {
      findMany: vi.fn(),
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

describe("activePartnerBannerWhere", () => {
  it("requires active flag and valid date window", () => {
    const now = new Date("2026-06-21T12:00:00Z");
    expect(activePartnerBannerWhere(now)).toEqual({
      isActive: true,
      AND: [
        { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
        { OR: [{ endsAt: null }, { endsAt: { gt: now } }] },
      ],
    });
  });
});

describe("listBannersForSlot", () => {
  beforeEach(() => {
    vi.mocked(prisma.partnerBanner.findMany).mockReset();
  });

  it("queries slot with published store filter", async () => {
    vi.mocked(prisma.partnerBanner.findMany).mockResolvedValue([]);

    await listBannersForSlot("HOME_TOP", 1);

    expect(prisma.partnerBanner.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ slot: "HOME_TOP" }),
        take: 1,
      })
    );
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

  it("filters by category when provided", async () => {
    vi.mocked(prisma.partnerStore.findMany).mockResolvedValue([]);

    await listPublishedPartners({ category: "FOOD" });

    expect(prisma.partnerStore.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ category: "FOOD" }),
      })
    );
  });
});
