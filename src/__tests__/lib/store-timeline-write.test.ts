import { describe, expect, it, vi } from "vitest";
import {
  canUserManagePromoPostByStoreName,
  canUserWriteStoreTimeline,
  getStoreTimelineWriteHref,
} from "@/lib/partner/store-timeline-write";

vi.mock("@/lib/partner/queries", () => ({
  getPartnerStoreByOwnerId: vi.fn(),
}));

import { getPartnerStoreByOwnerId } from "@/lib/partner/queries";

describe("getStoreTimelineWriteHref", () => {
  it("builds promo write URL with partner store slug", () => {
    expect(getStoreTimelineWriteHref("2d-sketch-cafe")).toBe(
      "/write?section=promo&partnerStore=2d-sketch-cafe"
    );
  });
});

describe("canUserWriteStoreTimeline", () => {
  const store = {
    ownerId: "owner-1",
    status: "PUBLISHED" as const,
  };

  it("allows linked owner", () => {
    expect(
      canUserWriteStoreTimeline(
        { user: { id: "owner-1" }, expires: "" } as never,
        store
      )
    ).toBe(true);
  });

  it("allows admin even without owner link", () => {
    expect(
      canUserWriteStoreTimeline(
        { user: { id: "admin-1", role: "ADMIN" }, expires: "" } as never,
        { ownerId: null, status: "PUBLISHED" }
      )
    ).toBe(true);
  });

  it("denies other users and missing owner", () => {
    expect(
      canUserWriteStoreTimeline(
        { user: { id: "other" }, expires: "" } as never,
        store
      )
    ).toBe(false);
    expect(canUserWriteStoreTimeline(null, store)).toBe(false);
    expect(
      canUserWriteStoreTimeline(
        { user: { id: "owner-1" }, expires: "" } as never,
        { ...store, ownerId: null }
      )
    ).toBe(false);
  });
});

describe("canUserManagePromoPostByStoreName", () => {
  it("allows admin", async () => {
    expect(
      await canUserManagePromoPostByStoreName(
        { user: { id: "admin-1", role: "ADMIN" }, expires: "" } as never,
        "2D Sketch Cafe"
      )
    ).toBe(true);
  });

  it("allows owner when storeName matches", async () => {
    vi.mocked(getPartnerStoreByOwnerId).mockResolvedValue({
      name: "2D Sketch Cafe",
    } as never);

    expect(
      await canUserManagePromoPostByStoreName(
        { user: { id: "owner-1" }, expires: "" } as never,
        "2d sketch cafe"
      )
    ).toBe(true);
  });

  it("denies owner for other store posts", async () => {
    vi.mocked(getPartnerStoreByOwnerId).mockResolvedValue({
      name: "Other Store",
    } as never);

    expect(
      await canUserManagePromoPostByStoreName(
        { user: { id: "owner-1" }, expires: "" } as never,
        "2D Sketch Cafe"
      )
    ).toBe(false);
  });
});
