import { describe, expect, it, vi, beforeEach } from "vitest";
import { NextResponse } from "next/server";
import { POST } from "@/app/api/admin/partners/route";

vi.mock("@/lib/api/enforce-rate-limit", () => ({
  enforcePreset: vi.fn().mockResolvedValue(null),
}));

vi.mock("@/lib/admin/require-admin-api", () => ({
  requireAdminApi: vi.fn(),
}));

vi.mock("@/lib/admin/audit-log", () => ({
  writeAdminAudit: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    partnerStore: {
      create: vi.fn(),
    },
  },
}));

vi.mock("@/lib/partner/queries", () => ({
  isPartnerSlugTaken: vi.fn().mockResolvedValue(false),
  listPartnerStoresForAdmin: vi.fn().mockResolvedValue([]),
}));

import { requireAdminApi } from "@/lib/admin/require-admin-api";
import { prisma } from "@/lib/prisma";

describe("POST /api/admin/partners", () => {
  beforeEach(() => {
    vi.mocked(requireAdminApi).mockReset();
    vi.mocked(prisma.partnerStore.create).mockReset();
  });

  it("returns 403 for non-admin", async () => {
    vi.mocked(requireAdminApi).mockResolvedValue({
      session: null,
      error: NextResponse.json({ ok: false, error: "권한이 없습니다." }, { status: 403 }),
    });

    const res = await POST(
      new Request("http://localhost/api/admin/partners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Test Store",
          slug: "test-store",
          category: "FOOD",
        }),
      })
    );

    expect(res.status).toBe(403);
  });

  it("rejects invalid payload", async () => {
    vi.mocked(requireAdminApi).mockResolvedValue({
      session: { user: { id: "admin-1", role: "ADMIN" } } as never,
      error: null,
    });

    const res = await POST(
      new Request("http://localhost/api/admin/partners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "",
          slug: "x",
          category: "FOOD",
        }),
      })
    );

    expect(res.status).toBe(400);
  });

  it("creates partner store for admin", async () => {
    vi.mocked(requireAdminApi).mockResolvedValue({
      session: { user: { id: "admin-1", role: "ADMIN" } } as never,
      error: null,
    });
    vi.mocked(prisma.partnerStore.create).mockResolvedValue({
      id: "c1",
      slug: "saigon-bbq",
      name: "Saigon BBQ",
    } as never);

    const res = await POST(
      new Request("http://localhost/api/admin/partners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Saigon BBQ",
          slug: "saigon-bbq",
          category: "FOOD",
          status: "DRAFT",
        }),
      })
    );

    expect(res.status).toBe(201);
    const json = (await res.json()) as { ok: boolean; store?: { slug: string } };
    expect(json.ok).toBe(true);
    expect(json.store?.slug).toBe("saigon-bbq");
  });
});
