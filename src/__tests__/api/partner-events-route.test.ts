import { describe, expect, it, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/partner/events/route";

vi.mock("@/lib/api/enforce-rate-limit", () => ({
  enforcePreset: vi.fn().mockResolvedValue(null),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    partnerStore: { findFirst: vi.fn() },
    partnerEvent: { create: vi.fn() },
  },
}));

import { prisma } from "@/lib/prisma";

describe("POST /api/partner/events", () => {
  beforeEach(() => {
    vi.mocked(prisma.partnerStore.findFirst).mockReset();
    vi.mocked(prisma.partnerEvent.create).mockReset();
  });

  it("returns 404 when store not published", async () => {
    vi.mocked(prisma.partnerStore.findFirst).mockResolvedValue(null);

    const res = await POST(
      new Request("http://localhost/api/partner/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: "missing", eventType: "VIEW" }),
      })
    );
    expect(res.status).toBe(404);
  });

  it("records VIEW event for published store", async () => {
    vi.mocked(prisma.partnerStore.findFirst).mockResolvedValue({
      id: "store-1",
    } as never);
    vi.mocked(prisma.partnerEvent.create).mockResolvedValue({} as never);

    const res = await POST(
      new Request("http://localhost/api/partner/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: "saigon-bbq-demo", eventType: "VIEW" }),
      })
    );
    expect(res.status).toBe(200);
    expect(prisma.partnerEvent.create).toHaveBeenCalled();
  });

  it("skips duplicate BANNER_CLICK when click cookie present", async () => {
    vi.mocked(prisma.partnerStore.findFirst).mockResolvedValue({
      id: "store-1",
    } as never);

    const res = await POST(
      new Request("http://localhost/api/partner/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          cookie: "hokei_pec_store-1=1",
        },
        body: JSON.stringify({ slug: "saigon-bbq-demo", eventType: "BANNER_CLICK" }),
      })
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.counted).toBe(false);
    expect(prisma.partnerEvent.create).not.toHaveBeenCalled();
  });
});
