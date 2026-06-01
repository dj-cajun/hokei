import { describe, expect, it, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/auth/signup/route";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock("@/lib/api/enforce-rate-limit", () => ({
  enforcePreset: vi.fn().mockResolvedValue(null),
}));

vi.mock("bcryptjs", () => ({
  hash: vi.fn().mockResolvedValue("hashed"),
}));

import { prisma } from "@/lib/prisma";

describe("POST /api/auth/signup", () => {
  beforeEach(() => {
    vi.mocked(prisma.user.findUnique).mockReset();
    vi.mocked(prisma.user.create).mockReset();
  });

  it("returns 400 for invalid body", async () => {
    const res = await POST(
      new Request("http://localhost/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "a", email: "bad", password: "1" }),
      })
    );
    expect(res.status).toBe(400);
    const json = (await res.json()) as { ok: boolean };
    expect(json.ok).toBe(false);
  });

  it("returns 409 when email exists", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "u1",
      email: "t@e.com",
      name: "x",
      password: "h",
      role: "USER",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const res = await POST(
      new Request("http://localhost/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "테스트",
          email: "t@e.com",
          password: "pass1234",
        }),
      })
    );
    expect(res.status).toBe(409);
  });

  it("creates user on success", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.user.create).mockResolvedValue({
      id: "new",
      email: "new@e.com",
      name: "신규",
      role: "USER",
      createdAt: new Date(),
    });

    const res = await POST(
      new Request("http://localhost/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "신규회원",
          email: "new@e.com",
          password: "pass1234",
        }),
      })
    );
    expect(res.status).toBe(201);
    const json = (await res.json()) as { ok: boolean; user?: { email: string } };
    expect(json.ok).toBe(true);
    expect(json.user?.email).toBe("new@e.com");
  });
});
