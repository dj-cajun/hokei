import { existsSync, readFileSync } from "fs";
import { join } from "path";

/** `prisma generate` 결과물의 datasource provider (런타임 adapter 검증용) */
export function getGeneratedPrismaActiveProvider(): "sqlite" | "postgresql" {
  const classPath = join(
    process.cwd(),
    "src/generated/prisma/internal/class.ts"
  );
  if (!existsSync(classPath)) return "sqlite";

  const content = readFileSync(classPath, "utf8");
  const match = content.match(/"activeProvider":\s*"(sqlite|postgresql)"/);
  return match?.[1] === "postgresql" ? "postgresql" : "sqlite";
}
