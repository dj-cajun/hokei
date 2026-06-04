import { afterEach, describe, expect, it, vi } from "vitest";
import {
  GOOGLE_FEDCM_FOR_PROMPT,
  shouldEnableGoogleOneTap,
} from "@/lib/auth/secure-auth-context";

describe("secure-auth-context", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("FedCM is always off", () => {
    expect(GOOGLE_FEDCM_FOR_PROMPT).toBe(false);
  });

  it("disables One Tap on http localhost", () => {
    vi.stubGlobal("window", {
      location: { protocol: "http:", hostname: "localhost" },
    } as Window & typeof globalThis);
    expect(shouldEnableGoogleOneTap()).toBe(false);
  });

  it("disables One Tap on https localhost", () => {
    vi.stubGlobal("window", {
      location: { protocol: "https:", hostname: "localhost" },
    } as Window & typeof globalThis);
    expect(shouldEnableGoogleOneTap()).toBe(false);
  });

  it("disables One Tap on https production unless opt-in", () => {
    vi.stubGlobal("window", {
      location: { protocol: "https:", hostname: "hokei-peach.vercel.app" },
    } as Window & typeof globalThis);
    expect(shouldEnableGoogleOneTap()).toBe(false);
  });

  it("enables One Tap when NEXT_PUBLIC_GOOGLE_ONE_TAP=true", () => {
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_ONE_TAP", "true");
    vi.stubGlobal("window", {
      location: { protocol: "https:", hostname: "hokei-peach.vercel.app" },
    } as Window & typeof globalThis);
    expect(shouldEnableGoogleOneTap()).toBe(true);
  });

  it("respects NEXT_PUBLIC_GOOGLE_DISABLE_ONE_TAP", () => {
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_DISABLE_ONE_TAP", "true");
    vi.stubGlobal("window", {
      location: { protocol: "https:", hostname: "hokei-peach.vercel.app" },
    } as Window & typeof globalThis);
    expect(shouldEnableGoogleOneTap()).toBe(false);
  });
});
