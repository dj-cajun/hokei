import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { PRISMA_DATASOURCE_PROVIDER } from "@/lib/prisma-datasource";
import { isPostgresDatabaseUrl } from "@/lib/read-env-file";

/** `prisma generate` 결과물의 datasource provider (런타임 adapter 검증용) */
export function getGeneratedPrismaActiveProvider(): "sqlite" | "postgresql" {
  const candidates = [
    join(process.cwd(), "src/generated/prisma/internal/class.ts"),
    join(process.cwd(), "src/generated/prisma/internal/class.js"),
  ];

  for (const classPath of candidates) {
    if (!existsSync(classPath)) continue;
    const content = readFileSync(classPath, "utf8");
    const match = content.match(/"activeProvider":\s*"(sqlite|postgresql)"/);
    if (match?.[1] === "postgresql" || match?.[1] === "sqlite") {
      return match[1];
    }
  }

  // Vercel 번들: 소스 class.ts 없음 → 빌드 marker·DATABASE_URL로 판별
  if (PRISMA_DATASOURCE_PROVIDER === "postgresql") return "postgresql";
  if (PRISMA_DATASOURCE_PROVIDER === "sqlite") return "sqlite";

  const url = process.env.DATABASE_URL?.trim() ?? "";
  return isPostgresDatabaseUrl(url) ? "postgresql" : "sqlite";
}
