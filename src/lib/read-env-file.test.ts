import { afterEach, describe, expect, it, vi } from "vitest";
import { resolveDatabaseUrlForPrismaGenerate } from "@/lib/read-env-file";

describe("resolveDatabaseUrlForPrismaGenerate", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("prefers .env sqlite when shell has leftover postgres URL", () => {
    vi.stubEnv("DATABASE_URL", "postgresql://neon.example/db");
    vi.stubEnv("VERCEL", "");
    const url = resolveDatabaseUrlForPrismaGenerate();
    expect(url).toBe("file:./dev.db");
  });

  it("uses postgres on Vercel", () => {
    vi.stubEnv("DATABASE_URL", "postgresql://neon.example/db");
    vi.stubEnv("VERCEL", "1");
    expect(resolveDatabaseUrlForPrismaGenerate()).toBe(
      "postgresql://neon.example/db"
    );
  });
});
