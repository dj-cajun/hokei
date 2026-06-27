import { describe, expect, it, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/admin/partners/route";

vi.mock("@/lib/admin/require-admin-api", () => ({
  requireAdminApi: vi.fn(),
}));

vi.mock("@/lib/api/enforce-rate-limit", () => ({
  enforcePreset: vi.fn().mockResolvedValue(null),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    partnerStore: { findMany: vi.fn() },
  },
}));

import { requireAdminApi } from "@/lib/admin/require-admin-api";
import { NextResponse } from "next/server";

describe("GET /api/admin/partners", () => {
  beforeEach(() => {
    vi.mocked(requireAdminApi).mockReset();
  });

  it("returns 401 when not admin", async () => {
    vi.mocked(requireAdminApi).mockResolvedValue({
      error: NextResponse.json({ ok: false, error: "Forbidden" }, { status: 401 }),
    } as never);

    const res = await GET(new Request("http://localhost/api/admin/partners"));
    expect(res.status).toBe(401);
  });
});
