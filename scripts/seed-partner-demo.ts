import "dotenv/config";
import { createPostgresPrisma } from "../src/lib/prisma-pg";

const DEMO_SLUG = "saigon-bbq-demo";

async function main() {
  const url = process.env.DATABASE_URL?.trim() ?? "";
  if (!url.startsWith("postgresql://") && !url.startsWith("postgres://")) {
    console.error("[seed-partner-demo] DATABASE_URL(Postgres) 필요");
    process.exit(1);
  }

  const prisma = createPostgresPrisma(url);

  const store = await prisma.partnerStore.upsert({
    where: { slug: DEMO_SLUG },
    create: {
      slug: DEMO_SLUG,
      name: "사이공 BBQ (데모)",
      tagline: "호치민 1군 · 한식 바베큐",
      description:
        "호케이 제휴 업소 데모 페이지입니다.\n실제 영업 정보는 관리자가 수정해 주세요.",
      category: "FOOD",
      phone: "+84 90 123 4567",
      kakaoLink: "https://pf.kakao.com/_xbxhTG/chat",
      mapsUrl: "https://maps.google.com/?q=10.7769,106.7009",
      address: "District 1, Ho Chi Minh City",
      hoursText: "10:00 – 22:00",
      thumbnail: null,
      plan: "STANDARD",
      status: "PUBLISHED",
      sortOrder: 0,
      publishedAt: new Date(),
      expiresAt: null,
    },
    update: {
      name: "사이공 BBQ (데모)",
      tagline: "호치민 1군 · 한식 바베큐",
      status: "PUBLISHED",
      publishedAt: new Date(),
    },
  });

  const existingBanner = await prisma.partnerBanner.findFirst({
    where: { storeId: store.id, slot: "HOME_BOTTOM" },
  });

  if (!existingBanner) {
    await prisma.partnerBanner.create({
      data: {
        storeId: store.id,
        slot: "HOME_BOTTOM",
        imageUrl: "https://www.hokei.vn/icons/hokei-icon-512.png",
        altText: "사이공 BBQ (데모)",
        isActive: true,
        sortOrder: 0,
      },
    });
  }

  console.log(`[seed-partner-demo] OK store=/store/${store.slug}`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("[seed-partner-demo] 실패", err);
  process.exit(1);
});
