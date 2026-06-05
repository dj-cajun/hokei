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

vi.mock("@/lib/auth/email-verification", () => ({
  issueEmailVerification: vi.fn().mockResolvedValue({ emailSent: true }),
}));

import { prisma } from "@/lib/prisma";
import { issueEmailVerification } from "@/lib/auth/email-verification";

const validBody = {
  name: "신규회원",
  email: "new@e.com",
  password: "pass1234",
  confirmPassword: "pass1234",
};

describe("POST /api/auth/signup", () => {
  beforeEach(() => {
    vi.mocked(prisma.user.findUnique).mockReset();
    vi.mocked(prisma.user.create).mockReset();
    vi.mocked(issueEmailVerification).mockClear();
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

  it("returns 400 when passwords do not match", async () => {
    const res = await POST(
      new Request("http://localhost/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...validBody,
          confirmPassword: "different1",
        }),
      })
    );
    expect(res.status).toBe(400);
  });

  it("returns 409 when verified email exists", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "u1",
      email: "t@e.com",
      name: "x",
      emailVerified: new Date(),
    } as never);

    const res = await POST(
      new Request("http://localhost/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...validBody,
          email: "t@e.com",
        }),
      })
    );
    expect(res.status).toBe(409);
  });

  it("resends verification for unverified existing email", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "u1",
      email: "t@e.com",
      name: "x",
      emailVerified: null,
    } as never);

    const res = await POST(
      new Request("http://localhost/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...validBody,
          email: "t@e.com",
        }),
      })
    );
    expect(res.status).toBe(200);
    expect(issueEmailVerification).toHaveBeenCalled();
  });

  it("creates user and sends verification on success", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.user.create).mockResolvedValue({
      id: "new",
      email: "new@e.com",
      name: "신규",
      role: "USER",
      createdAt: new Date(),
    } as never);

    const res = await POST(
      new Request("http://localhost/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validBody),
      })
    );
    expect(res.status).toBe(201);
    const json = (await res.json()) as {
      ok: boolean;
      requiresVerification?: boolean;
      user?: { email: string };
    };
    expect(json.ok).toBe(true);
    expect(json.requiresVerification).toBe(true);
    expect(json.user?.email).toBe("new@e.com");
    expect(issueEmailVerification).toHaveBeenCalled();
  });

  it("returns 201 when email send fails but user is created", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.user.create).mockResolvedValue({
      id: "new",
      email: "new@e.com",
      name: "신규",
      role: "USER",
      createdAt: new Date(),
    } as never);
    vi.mocked(issueEmailVerification).mockResolvedValue({ emailSent: false });

    const res = await POST(
      new Request("http://localhost/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validBody),
      })
    );
    expect(res.status).toBe(201);
    const json = (await res.json()) as {
      ok: boolean;
      emailSent?: boolean;
      message?: string;
    };
    expect(json.ok).toBe(true);
    expect(json.emailSent).toBe(false);
    expect(json.message).toContain("인증 메일 발송에 실패");
  });
});
