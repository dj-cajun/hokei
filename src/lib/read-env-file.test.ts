import { afterEach, describe, expect, it, vi } from "vitest";
import {
  resolveDatabaseUrlForPrismaGenerate,
  resolveLocalDevDatabaseUrl,
} from "@/lib/read-env-file";

describe("resolveLocalDevDatabaseUrl", () => {
  it("prefers postgres from process env", () => {
    expect(
      resolveLocalDevDatabaseUrl(
        "postgresql://neon.example/db",
        "file:./dev.db"
      )
    ).toBe("postgresql://neon.example/db");
  });

  it("falls back to postgres in .env file", () => {
    expect(resolveLocalDevDatabaseUrl("", "postgresql://neon.example/db")).toBe(
      "postgresql://neon.example/db"
    );
  });

  it("returns empty when neither is postgres", () => {
    expect(resolveLocalDevDatabaseUrl("", "file:./dev.db")).toBe("file:./dev.db");
  });
});

describe("resolveDatabaseUrlForPrismaGenerate", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("uses postgres on Vercel", () => {
    vi.stubEnv("DATABASE_URL", "postgresql://neon.example/db");
    vi.stubEnv("VERCEL", "1");
    expect(resolveDatabaseUrlForPrismaGenerate()).toBe(
      "postgresql://neon.example/db"
    );
  });

  it("does not fall back to sqlite on Vercel when DATABASE_URL is missing", () => {
    vi.stubEnv("DATABASE_URL", "");
    vi.stubEnv("VERCEL", "1");
    expect(resolveDatabaseUrlForPrismaGenerate()).toBe("");
  });

  it("prefers process DATABASE_URL in CI over .env file", () => {
    vi.stubEnv("DATABASE_URL", "file:./ci-e2e.db");
    vi.stubEnv("CI", "true");
    vi.stubEnv("VERCEL", "");
    expect(resolveDatabaseUrlForPrismaGenerate()).toBe("file:./ci-e2e.db");
  });
});
