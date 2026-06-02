import { describe, expect, it } from "vitest";
import {
  GOOGLE_REDIRECT_LOGIN_PATH,
  getGoogleRedirectLoginUri,
} from "@/lib/auth/google-redirect-uri";

describe("getGoogleRedirectLoginUri", () => {
  it("builds redirect callback path", () => {
    expect(getGoogleRedirectLoginUri("https://hokei-peach.vercel.app")).toBe(
      `https://hokei-peach.vercel.app${GOOGLE_REDIRECT_LOGIN_PATH}`
    );
  });

  it("uses request origin for local dev", () => {
    expect(getGoogleRedirectLoginUri("http://localhost:3001")).toBe(
      `http://localhost:3001${GOOGLE_REDIRECT_LOGIN_PATH}`
    );
  });
});
