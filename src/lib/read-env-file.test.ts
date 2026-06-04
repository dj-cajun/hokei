import { afterEach, describe, expect, it, vi } from "vitest";
import {
  resolveDatabaseUrlForPrismaGenerate,
  resolveLocalDevDatabaseUrl,
} from "@/lib/read-env-file";

describe("resolveLocalDevDatabaseUrl", () => {
  it("prefers .env sqlite when shell has leftover postgres URL", () => {
    expect(
      resolveLocalDevDatabaseUrl(
        "postgresql://neon.example/db",
        "file:./dev.db"
      )
    ).toBe("file:./dev.db");
  });

  it("uses process env when not sqlite override", () => {
    expect(resolveLocalDevDatabaseUrl("", "file:./dev.db")).toBe("file:./dev.db");
    expect(
      resolveLocalDevDatabaseUrl("postgresql://neon.example/db", "")
    ).toBe("postgresql://neon.example/db");
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
});
