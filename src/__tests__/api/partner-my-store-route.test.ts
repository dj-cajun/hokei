import { describe, expect, it, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/partner/my-store/route";

vi.mock("@/lib/api/enforce-rate-limit", () => ({
  enforcePreset: vi.fn().mockResolvedValue(null),
}));

vi.mock("@/lib/partner/require-partner-owner-api", () => ({
  requirePartnerOwnerApi: vi.fn(),
}));

import { requirePartnerOwnerApi } from "@/lib/partner/require-partner-owner-api";
import { NextResponse } from "next/server";

describe("GET /api/partner/my-store", () => {
  beforeEach(() => {
    vi.mocked(requirePartnerOwnerApi).mockReset();
  });

  it("returns 401 when not logged in", async () => {
    vi.mocked(requirePartnerOwnerApi).mockResolvedValue({
      session: null,
      store: null,
      error: NextResponse.json({ ok: false, error: "로그인이 필요합니다." }, {
        status: 401,
      }),
    } as never);

    const res = await GET(new Request("http://localhost/api/partner/my-store"));
    expect(res.status).toBe(401);
  });
});
