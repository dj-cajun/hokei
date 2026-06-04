import { describe, expect, it } from "vitest";
import { Prisma } from "@/generated/prisma/client";
import { googleLoginErrorCodeFromUnknown } from "@/lib/auth/google-login-error-code";

describe("googleLoginErrorCodeFromUnknown", () => {
  it("maps Prisma known errors", () => {
    expect(
      googleLoginErrorCodeFromUnknown(
        new Prisma.PrismaClientKnownRequestError("msg", {
          code: "P2022",
          clientVersion: "test",
        })
      )
    ).toBe("google_db_error");
  });

  it("maps provider mismatch message", () => {
    expect(
      googleLoginErrorCodeFromUnknown(
        new Error(
          "Prisma Client(provider=sqlite)와 DATABASE_URL(postgresql)이 맞지 않습니다."
        )
      )
    ).toBe("google_db_config");
  });
});
