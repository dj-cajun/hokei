import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  getPartnerStoreBySlug,
  getPartnerStoreRecordBySlug,
  isPartnerStorePublic,
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

describe("isPartnerStorePublic", () => {
  const now = new Date("2026-06-21T00:00:00Z");

  it("accepts published non-expired store", () => {
    expect(
      isPartnerStorePublic(
        { status: "PUBLISHED", expiresAt: new Date("2026-12-01") },
        now
      )
    ).toBe(true);
  });

  it("rejects draft store", () => {
    expect(
      isPartnerStorePublic({ status: "DRAFT", expiresAt: null }, now)
    ).toBe(false);
  });

  it("rejects expired store", () => {
    expect(
      isPartnerStorePublic(
        { status: "PUBLISHED", expiresAt: new Date("2026-01-01") },
        now
      )
    ).toBe(false);
  });
});

describe("getPartnerStoreRecordBySlug", () => {
  beforeEach(() => {
    vi.mocked(prisma.partnerStore.findUnique).mockReset();
  });

  it("queries by slug without status filter", async () => {
    vi.mocked(prisma.partnerStore.findUnique).mockResolvedValue({
      id: "c1",
      slug: "draft-store",
      status: "DRAFT",
    } as never);

    const store = await getPartnerStoreRecordBySlug("draft-store");
    expect(store?.status).toBe("DRAFT");
    expect(prisma.partnerStore.findUnique).toHaveBeenCalledWith({
      where: { slug: "draft-store" },
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
