import { describe, expect, it } from "vitest";
import { signupSchema } from "@/lib/validation/signup";
import { postCreateBodySchema } from "@/lib/validation/post-create";

describe("signupSchema", () => {
  it("accepts valid signup", () => {
    const r = signupSchema.safeParse({
      name: "홍길동",
      email: "test@example.com",
      password: "pass1234",
      confirmPassword: "pass1234",
    });
    expect(r.success).toBe(true);
  });

  it("rejects mismatched passwords", () => {
    const r = signupSchema.safeParse({
      name: "홍길동",
      email: "test@example.com",
      password: "pass1234",
      confirmPassword: "pass9999",
    });
    expect(r.success).toBe(false);
  });

  it("rejects weak password", () => {
    const r = signupSchema.safeParse({
      name: "홍길동",
      email: "test@example.com",
      password: "12345678",
      confirmPassword: "12345678",
    });
    expect(r.success).toBe(false);
  });
});

describe("postCreateBodySchema", () => {
  it("requires minimum content length", () => {
    const r = postCreateBodySchema.safeParse({
      categoryId: "cat1",
      title: "제목입니다",
      content: "짧음",
    });
    expect(r.success).toBe(false);
  });

  it("accepts guest post fields", () => {
    const r = postCreateBodySchema.safeParse({
      categoryId: "cat1",
      title: "제목입니다 충분",
      content: "본문이 열 자 이상이어야 합니다.",
      guestName: "익명",
      guestPassword: "1234",
    });
    expect(r.success).toBe(true);
  });
});
