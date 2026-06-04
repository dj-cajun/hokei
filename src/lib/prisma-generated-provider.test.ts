import { describe, expect, it } from "vitest";
import { getGeneratedPrismaActiveProvider } from "@/lib/prisma-generated-provider";

describe("getGeneratedPrismaActiveProvider", () => {
  it("returns sqlite or postgresql from generated client", () => {
    const provider = getGeneratedPrismaActiveProvider();
    expect(["sqlite", "postgresql"]).toContain(provider);
  });
});
