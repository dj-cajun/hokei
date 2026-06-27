import "dotenv/config";
import { createPostgresPrisma } from "../src/lib/prisma-pg";

const DEMO_SLUG = "makdong-jjamppong";

async function main() {
  const url = process.env.DATABASE_URL?.trim() ?? "";
  if (!url.startsWith("postgres")) {
    throw new Error("DATABASE_URL이 필요합니다.");
  }

  const prisma = createPostgresPrisma(url);
  try {
    const store = await prisma.partnerStore.upsert({
      where: { slug: DEMO_SLUG },
      create: {
        slug: DEMO_SLUG,
        name: "막둥이네 짬뽕",
        tagline: "1군 · 한식",
        description:
          "호치민 1군 한인 맛집. 짬뽕·짜장면·탕수육. 카톡으로 예약·문의해 주세요.",
        category: "FOOD",
        phone: "+84 90 123 4567",
        kakaoLink: "https://pf.kakao.com/_xbxhTG/chat",
        mapsUrl: "https://maps.google.com/?q=10.7769,106.7009",
        address: "123 Nguyễn Huệ, Quận 1, TP.HCM",
        hoursText: "10:00–22:00 (연중무휴)",
        thumbnail: null,
        plan: "STANDARD",
        status: "PUBLISHED",
        sortOrder: 0,
        publishedAt: new Date(),
        expiresAt: null,
      },
      update: {
        name: "막둥이네 짬뽕",
        tagline: "1군 · 한식",
        status: "PUBLISHED",
        publishedAt: new Date(),
      },
    });

    console.log(`PartnerStore demo: /store/${store.slug} (${store.id})`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
