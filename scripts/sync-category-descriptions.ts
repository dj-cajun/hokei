/**
 * CATEGORY_MASTER 기준으로 Category.description 복구 (delete 없이 update)
 */
import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client";
import { createPostgresPrisma } from "../src/lib/prisma-pg";
import { CATEGORY_MASTER } from "../prisma/seed-categories";

function createPrisma() {
  const connectionString = process.env.DATABASE_URL ?? "file:./dev.db";
  if (
    connectionString.startsWith("postgresql://") ||
    connectionString.startsWith("postgres://")
  ) {
    return createPostgresPrisma(connectionString);
  }
  const adapter = new PrismaBetterSqlite3({ url: connectionString });
  return new PrismaClient({ adapter });
}

const prisma = createPrisma();

async function main() {
  let updated = 0;

  for (const section of CATEGORY_MASTER) {
    const parent = await prisma.category.updateMany({
      where: { slug: section.slug, parentId: null },
      data: { description: section.description },
    });
    updated += parent.count;

    for (const child of section.children) {
      const childSlug = `${section.slug}-${child.slug}`;
      const childRow = await prisma.category.updateMany({
        where: { slug: childSlug },
        data: { description: child.description },
      });
      updated += childRow.count;
    }
  }

  console.log(`✓ Category.description synced: ${updated} rows updated`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
