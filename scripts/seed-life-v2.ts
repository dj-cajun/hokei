import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import "dotenv/config";
import { LifeDomain, LifeGuideKind } from "../src/generated/prisma/client";
import { createPostgresPrisma } from "../src/lib/prisma-pg";

type LifeSeedRow = {
  slug: string;
  kind: LifeGuideKind;
  domain: LifeDomain;
  title: string;
  vnText?: string | null;
  body: string;
  audioUrl?: string;
  fileUrl?: string;
  sourceLabel?: string;
  externalUrl?: string;
  sortOrder?: number;
};

function loadJson<T>(name: string): T[] {
  const path = resolve(process.cwd(), "data", name);
  return JSON.parse(readFileSync(path, "utf8")) as T[];
}

async function seedLife(prisma: ReturnType<typeof createPostgresPrisma>) {
  const rows = loadJson<LifeSeedRow>("life-guides-seed.json");
  let upserted = 0;
  for (const row of rows) {
    await prisma.lifeGuide.upsert({
      where: { slug: row.slug },
      create: {
        slug: row.slug,
        kind: row.kind,
        domain: row.domain,
        title: row.title,
        vnText: row.vnText ?? null,
        body: row.body,
        audioUrl: row.audioUrl ?? null,
        fileUrl: row.fileUrl ?? null,
        sourceLabel: row.sourceLabel ?? null,
        externalUrl: row.externalUrl ?? null,
        sortOrder: row.sortOrder ?? 0,
        isCrawl: false,
      },
      update: {
        kind: row.kind,
        domain: row.domain,
        title: row.title,
        vnText: row.vnText ?? null,
        body: row.body,
        audioUrl: row.audioUrl ?? null,
        fileUrl: row.fileUrl ?? null,
        sourceLabel: row.sourceLabel ?? null,
        externalUrl: row.externalUrl ?? null,
        sortOrder: row.sortOrder ?? 0,
      },
    });
    upserted++;
  }
  return upserted;
}

async function main() {
  const url = process.env.DATABASE_URL?.trim() ?? "";
  if (!url.startsWith("postgres")) {
    throw new Error("DATABASE_URL이 필요합니다.");
  }
  const prisma = createPostgresPrisma(url);
  try {
    const life = await seedLife(prisma);
    console.log(`LifeGuide: ${life}건 upsert`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
