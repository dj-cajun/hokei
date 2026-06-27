import "dotenv/config";
import { createPostgresPrisma } from "../src/lib/prisma-pg";

const DEMO_SLUG = "saigon-bbq-demo";

/** 홈 배너는 2D SKETCH CAFE 전용 — 데모 업소 배너 비활성 */
async function deactivateHomeBanners(
  prisma: ReturnType<typeof createPostgresPrisma>,
  storeId: string
) {
  await prisma.partnerBanner.updateMany({
    where: {
      storeId,
      slot: { in: ["HOME_TOP", "HOME_BOTTOM"] },
    },
    data: { isActive: false },
  });
}

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
      introText:
        "호케이 제휴 업소 데모입니다. 카톡·전화·지도 CTA와 LP 7섹션 필드를 확인해 보세요.",
      description:
        "레거시 상세 설명 필드입니다. introText가 있으면 LP 본문에는 introText가 우선 노출됩니다.",
      menuText:
        "삼겹살 세트 · 350,000₫\n갈비 · 420,000₫\n냉면 · 80,000₫",
      category: "FOOD",
      phone: "+84 90 123 4567",
      kakaoLink: "https://pf.kakao.com/_xbxhTG/chat",
      mapsUrl: "https://maps.google.com/?q=10.7769,106.7009",
      address: "District 1, Ho Chi Minh City",
      locationTips: "1군 중심 · Grab 검색: Saigon BBQ Demo",
      hoursText: "매일 10:00 – 22:00\n\n🎉 데모 이벤트 — 관리자가 hoursText로 자유 입력",
      thumbnail: "/partners/2d-sketch-cafe-event-banner.jpg",
      plan: "STANDARD",
      status: "PUBLISHED",
      sortOrder: 10,
      publishedAt: new Date(),
      expiresAt: null,
    },
    update: {
      name: "사이공 BBQ (데모)",
      tagline: "호치민 1군 · 한식 바베큐",
      introText:
        "호케이 제휴 업소 데모입니다. 카톡·전화·지도 CTA와 LP 7섹션 필드를 확인해 보세요.",
      menuText:
        "삼겹살 세트 · 350,000₫\n갈비 · 420,000₫\n냉면 · 80,000₫",
      locationTips: "1군 중심 · Grab 검색: Saigon BBQ Demo",
      hoursText: "매일 10:00 – 22:00\n\n🎉 데모 이벤트 — 관리자가 hoursText로 자유 입력",
      thumbnail: "/partners/2d-sketch-cafe-event-banner.jpg",
      status: "PUBLISHED",
      plan: "STANDARD",
      sortOrder: 10,
      publishedAt: new Date(),
    },
  });

  await deactivateHomeBanners(prisma, store.id);

  console.log(`[seed-partner-demo] OK`);
  console.log(`  LP: /store/${store.slug} (홈 배너 없음 — 2D SKETCH CAFE 우선)`);
  console.log(`  허브: /partners`);

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("[seed-partner-demo] 실패", err);
  process.exit(1);
});
