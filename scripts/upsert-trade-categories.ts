/**
 * 부동산·중고·취업 하위 카테고리 갱신
 * npm run db:upsert-trade
 */
import "dotenv/config";
import { createPostgresPrisma } from "../src/lib/prisma-pg";

type ChildSeed = {
  slug: string;
  label: string;
  description: string;
  icon: string;
  sortOrder: number;
};

const SECTIONS: {
  slug: string;
  children: ChildSeed[];
  migrate: Record<string, string>;
  deactivate: string[];
}[] = [
  {
    slug: "real-estate",
    children: [
      {
        slug: "tenant-seeking",
        label: "임차인 구합니다",
        description: "아파트·단기·룸메이트 등 임대 매물을 찾는 글",
        icon: "Home",
        sortOrder: 1,
      },
      {
        slug: "landlord-seeking",
        label: "임대인 구합니다",
        description: "세입자·룸메이트를 구하는 임대인·집주인 글",
        icon: "Building2",
        sortOrder: 2,
      },
    ],
    migrate: {
      "real-estate-apartment-rent": "real-estate-tenant-seeking",
      "real-estate-short-term-rent": "real-estate-tenant-seeking",
      "real-estate-roommate": "real-estate-tenant-seeking",
    },
    deactivate: [
      "real-estate-apartment-rent",
      "real-estate-short-term-rent",
      "real-estate-roommate",
    ],
  },
  {
    slug: "classifieds",
    children: [
      {
        slug: "buying",
        label: "삽니다",
        description: "구매 희망 중고·가구·차량 등",
        icon: "Package",
        sortOrder: 1,
      },
      {
        slug: "selling",
        label: "팝니다",
        description: "판매 중고·가구·오토바이·차량 등",
        icon: "Tags",
        sortOrder: 2,
      },
    ],
    migrate: {
      "classifieds-buy-sell": "classifieds-selling",
      "classifieds-motorcycle-car": "classifieds-selling",
    },
    deactivate: ["classifieds-buy-sell", "classifieds-motorcycle-car"],
  },
  {
    slug: "jobs",
    children: [
      {
        slug: "hiring",
        label: "구인",
        description:
          "베트남 진출 한국 기업, 호치민 로컬 매장·학원 한국인/베트남인 채용",
        icon: "UserPlus",
        sortOrder: 1,
      },
      {
        slug: "job-seeking",
        label: "구직",
        description:
          "통번역, 마케팅, IT 등 일자리를 구하는 교민·유학생 프로필",
        icon: "Search",
        sortOrder: 2,
      },
    ],
    migrate: {},
    deactivate: [],
  },
];

async function main() {
  const url = process.env.DATABASE_URL?.trim() ?? "";
  if (!url.startsWith("postgres")) {
    throw new Error("DATABASE_URL=postgresql://… 필요");
  }
  const prisma = createPostgresPrisma(url);

  for (const section of SECTIONS) {
    const parent = await prisma.category.findFirst({
      where: { slug: section.slug, parentId: null },
    });
    if (!parent) {
      console.warn(`skip: ${section.slug} 없음`);
      continue;
    }

    for (const child of section.children) {
      const fullSlug = `${section.slug}-${child.slug}`;
      const href = `/${section.slug}/${child.slug}`;
      const existing = await prisma.category.findFirst({
        where: { slug: fullSlug },
      });
      if (existing) {
        await prisma.category.update({
          where: { id: existing.id },
          data: {
            label: child.label,
            description: child.description,
            icon: child.icon,
            href,
            sortOrder: child.sortOrder,
            parentId: parent.id,
            isActive: true,
          },
        });
      } else {
        await prisma.category.create({
          data: {
            slug: fullSlug,
            label: child.label,
            description: child.description,
            icon: child.icon,
            colorClass: parent.colorClass,
            href,
            sortOrder: child.sortOrder,
            parentId: parent.id,
            isActive: true,
          },
        });
      }
      console.log(`✓ ${fullSlug}`);
    }

    for (const [from, to] of Object.entries(section.migrate)) {
      const fromCat = await prisma.category.findFirst({ where: { slug: from } });
      const toCat = await prisma.category.findFirst({ where: { slug: to } });
      if (!fromCat || !toCat) continue;
      const moved = await prisma.post.updateMany({
        where: { categoryId: fromCat.id },
        data: { categoryId: toCat.id },
      });
      if (moved.count > 0) {
        console.log(`✓ ${from} → ${to} 글 ${moved.count}건`);
      }
    }

    for (const slug of section.deactivate) {
      const legacy = await prisma.category.findFirst({ where: { slug } });
      if (!legacy) continue;
      await prisma.category.update({
        where: { id: legacy.id },
        data: { isActive: false },
      });
      console.log(`✓ ${slug} 비활성화`);
    }
  }

  await prisma.$disconnect();
  console.log("✓ 거래 카테고리 upsert 완료");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
