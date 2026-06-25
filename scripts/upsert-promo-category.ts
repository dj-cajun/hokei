/**
 * promo 3단계 카테고리 (promo → store → hungry|inconvenient)
 * npm run db:upsert-promo
 */
import "dotenv/config";
import { createPostgresPrisma } from "../src/lib/prisma-pg";

const PROMO_SECTION = {
  slug: "promo",
  label: "한인 업소 홍보",
  description:
    "반찬·식당·공동구매 전단. 업체별 타임라인으로 아카이브됩니다.",
  icon: "Flame",
  colorClass: "bg-rose-50 text-rose-600",
  sortOrder: 4,
  children: [
    {
      slug: "store",
      label: "여기 어때",
      description: "배고플때 · 불편할때 맛집·서비스 추천",
      icon: "Store",
      sortOrder: 1,
      children: [
        {
          slug: "hungry",
          label: "배고플때",
          description: "맛집·식당·반찬·야식 추천",
          icon: "Store",
          sortOrder: 1,
        },
        {
          slug: "inconvenient",
          label: "불편할때",
          description: "병원·정비·미용·생활 서비스 추천",
          icon: "HelpCircle",
          sortOrder: 2,
        },
      ],
    },
  ],
} as const;

type ChildSeed = {
  slug: string;
  label: string;
  description: string;
  icon: string;
  sortOrder: number;
  children?: readonly ChildSeed[];
};

async function upsertBranch(
  prisma: ReturnType<typeof createPostgresPrisma>,
  parentId: string,
  pathPrefix: string,
  colorClass: string,
  child: ChildSeed
) {
  const href = `${pathPrefix}/${child.slug}`;
  const fullSlug = href.split("/").filter(Boolean).join("-");

  const existing = await prisma.category.findFirst({ where: { slug: fullSlug } });
  const row = existing
    ? await prisma.category.update({
        where: { id: existing.id },
        data: {
          label: child.label,
          description: child.description,
          icon: child.icon,
          parentId,
          href,
          sortOrder: child.sortOrder,
          isActive: true,
        },
      })
    : await prisma.category.create({
        data: {
          slug: fullSlug,
          label: child.label,
          description: child.description,
          icon: child.icon,
          colorClass,
          href,
          sortOrder: child.sortOrder,
          parentId,
          isActive: true,
        },
      });

  if (child.children?.length) {
    for (const grand of child.children) {
      await upsertBranch(prisma, row.id, href, colorClass, grand);
    }
  }

  return row;
}

async function main() {
  const url = process.env.DATABASE_URL?.trim() ?? "";
  if (!url.startsWith("postgres")) {
    throw new Error("DATABASE_URL=postgresql://… 필요");
  }
  const prisma = createPostgresPrisma(url);

  let parent = await prisma.category.findFirst({
    where: { slug: PROMO_SECTION.slug, parentId: null },
  });

  if (!parent) {
    parent = await prisma.category.create({
      data: {
        slug: PROMO_SECTION.slug,
        label: PROMO_SECTION.label,
        description: PROMO_SECTION.description,
        icon: PROMO_SECTION.icon,
        colorClass: PROMO_SECTION.colorClass,
        href: `/${PROMO_SECTION.slug}`,
        sortOrder: PROMO_SECTION.sortOrder,
        isActive: true,
      },
    });
  } else {
    await prisma.category.update({
      where: { id: parent.id },
      data: {
        label: PROMO_SECTION.label,
        description: PROMO_SECTION.description,
        isActive: true,
      },
    });
  }

  for (const child of PROMO_SECTION.children) {
    await upsertBranch(
      prisma,
      parent.id,
      `/${PROMO_SECTION.slug}`,
      PROMO_SECTION.colorClass,
      child
    );
  }

  const hungry = await prisma.category.findFirst({
    where: { slug: "promo-store-hungry" },
  });
  for (const legacySlug of ["promo-hungry", "promo-inconvenient", "promo-group-buy"]) {
    const legacy = await prisma.category.findFirst({ where: { slug: legacySlug } });
    if (!legacy) continue;

    if (hungry && legacySlug === "promo-hungry") {
      const moved = await prisma.post.updateMany({
        where: { categoryId: legacy.id },
        data: { categoryId: hungry.id },
      });
      if (moved.count > 0) {
        console.log(`✓ promo-hungry 글 ${moved.count}건 → promo-store-hungry`);
      }
    }
    if (legacySlug === "promo-store") {
      continue;
    }

    await prisma.category.update({
      where: { id: legacy.id },
      data: { isActive: false },
    });
    console.log(`✓ ${legacySlug} 비활성화`);
  }

  console.log("✓ promo 3단계 카테고리 upsert 완료");
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
