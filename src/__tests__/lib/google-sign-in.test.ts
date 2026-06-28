import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthError } from "@auth/core/errors";

vi.mock("@/auth", () => ({
  signIn: vi.fn(),
}));

import { signIn } from "@/auth";
import { signInWithGoogleCredential } from "@/lib/auth/google-sign-in";

describe("signInWithGoogleCredential", () => {
  beforeEach(() => {
    vi.mocked(signIn).mockReset();
  });

  it("rethrows redirect errors so session cookies survive GIS redirect login", async () => {
    const redirectErr = Object.assign(new Error("NEXT_REDIRECT"), {
      digest: "NEXT_REDIRECT;replace;/;307;",
    });
    vi.mocked(signIn).mockRejectedValue(redirectErr);

    await expect(
      signInWithGoogleCredential("token", { redirect: true, redirectTo: "/" })
    ).rejects.toBe(redirectErr);
  });

  it("maps AuthError to a user-facing message", async () => {
    vi.mocked(signIn).mockRejectedValue(new AuthError("CredentialsSignin"));

    await expect(signInWithGoogleCredential("token")).rejects.toThrow(
      /구글 로그인에 실패/
    );
  });

  it("treats sign-in error redirects as failure when redirect is false", async () => {
    vi.mocked(signIn).mockResolvedValue("/api/auth/signin?error=CredentialsSignin");

    await expect(signInWithGoogleCredential("token")).rejects.toThrow(
      /구글 로그인에 실패/
    );
  });
});
