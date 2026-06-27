import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import "dotenv/config";
import type { PostTopic } from "../src/generated/prisma/client";
import { AI_CURATE_SOURCE_PREFIX } from "../src/lib/ai-curate-source";
import { createPostgresPrisma } from "../src/lib/prisma-pg";
import { mapSeedRegion } from "../prisma/seed-kakao-posts";

const SOURCE_URL = `${AI_CURATE_SOURCE_PREFIX}editorial:2d-sketch-cafe-review-202606`;

const POST_BODY = `호치민 1군 부이비엔 워킹스트릿 근처에 있는 2D SKETCH CAFE를 다녀왔습니다. 아직 많이 알려지지 않았지만, 앞으로 부이비엔 대표 포토스팟이 될 만한 곳이에요.

📍 위치
• 부이비엔 워킹스트릿 입구 쪽 푹롱(PHUC LONG) 카페에서 도보 약 1분
• 클럽 거리 중심부에서는 3~4분, 큰 도로변이라 찾기 쉬움
• 맞은편 풀만 호텔, 건너편에 대한민국 영사관 별관·한국교육원
• 주소: 74 Nguyễn Cư Trinh, Quận 1, Hồ Chí Minh
• 지도: https://maps.app.goo.gl/b3wZWs2uQcFrFGhc7

🎨 2D 세계로 들어가는 순간
입구만 보면 평범한 카페처럼 보이지만, 1층에서 주문 후 2층 계단 앞에 서면 분위기가 확 바뀝니다. 계단·벽·천장이 모두 손그림 벽화이고, 베트남 현지 작가가 직접 그렸다고 해요. 흑백 스케치 공간 속에서 컬러 옷을 입은 사람이 오히려 그림처럼 보이는 독특한 경험입니다.

📸 꼭 찍어야 할 포인트
• 계단 구간 — 반드시 셔터 눌러야 하는 대표 포토존
• 2·3층 사이 계단 — 사이공 강·다리 벽화 (2D·3D 착시)
• 3층→2층 계단 끝 — 벤탄시장으로 들어가는 듯한 착시 벽화 (현지인도 많이 찍는 스팟)
• 각 층 계단 입구 큰 거울 — 벽화와 사람이 한 장에 담기는 구도
• 2층 창가 — 호치민 도로·오토바이 풍경 + 맞은편 태극기
• 3층 — 하얀 드럼세트와 압축된 만화 세계, 작은 계단 포즈 인기
• 3층 야외 발코니 — 거리 내려다보며 커피·맥주 (1층 냉장고 맥주 판매)

☕ 분위기·운영
• 한국 2D 카페와 달리 공간 전체가 하나의 작품처럼 느껴짐
• 2층→3층 계단 옆 태극기·베트남 국기 — 한국인 사장님의 문화교류 의도
• K-POP이 자주 나오는 등 한국 감성이 자연스럽게 스며 있음
• 직원 유니폼도 흑백 라인 셔츠로 콘셉트 통일

🗓️ 총평
✔ 부이비엔 워킹스트릿 도보 1분
✔ 호치민에서 보기 드문 2D 콘셉트
✔ 계단·벽화·3층 드럼존·발코니 추천
✔ 2026년 6월 중순 오픈 — 아직 한산한 숨은 명소
✔ 한·베 문화가 공존하는 공간

특별한 사진을 남기고 싶다면, 흔한 카페가 아닌 기억에 남을 곳을 찾는 분께 추천합니다.

원문 후기: https://m.blog.naver.com/unkibass/224328356051
제휴 LP: https://www.hokei.vn/store/2d-sketch-cafe`;

type SeedFile = {
  partner: {
    slug: string;
    name: string;
    tagline: string;
    description: string;
    address: string;
    mapsUrl: string;
    hoursText: string;
  };
  post: {
    categorySlug: string;
    title: string;
    summary: string;
    storeName: string;
    region: string;
    topic: PostTopic;
    sourceKey: string;
    sourceName: string;
    publishedAtDate: string;
  };
};

function loadSeed(): SeedFile {
  const path = join(process.cwd(), "data/2d-sketch-cafe.json");
  if (!existsSync(path)) {
    throw new Error("data/2d-sketch-cafe.json 없음");
  }
  return JSON.parse(readFileSync(path, "utf-8")) as SeedFile;
}

async function main() {
  const url = process.env.DATABASE_URL?.trim() ?? "";
  if (!url.startsWith("postgresql://") && !url.startsWith("postgres://")) {
    console.error("[seed-2d-sketch-cafe] DATABASE_URL(Postgres) 필요");
    process.exit(1);
  }

  const seed = loadSeed();
  const prisma = createPostgresPrisma(url);

  const category = await prisma.category.findFirst({
    where: { slug: seed.post.categorySlug, isActive: true },
    select: { id: true },
  });
  if (!category) {
    throw new Error(
      `카테고리 ${seed.post.categorySlug} 없음 — npm run db:upsert-promo 실행 후 재시도`
    );
  }

  const publishedAt = new Date(`${seed.post.publishedAtDate}T12:00:00+07:00`);

  const store = await prisma.partnerStore.upsert({
    where: { slug: seed.partner.slug },
    create: {
      slug: seed.partner.slug,
      name: seed.partner.name,
      tagline: seed.partner.tagline,
      description: seed.partner.description,
      category: "FOOD",
      mapsUrl: seed.partner.mapsUrl,
      address: seed.partner.address,
      hoursText: seed.partner.hoursText,
      plan: "PREMIUM",
      status: "PUBLISHED",
      sortOrder: 1,
      publishedAt: new Date(),
      expiresAt: null,
    },
    update: {
      name: seed.partner.name,
      tagline: seed.partner.tagline,
      description: seed.partner.description,
      mapsUrl: seed.partner.mapsUrl,
      address: seed.partner.address,
      hoursText: seed.partner.hoursText,
      status: "PUBLISHED",
      plan: "PREMIUM",
    },
  });

  const bannerImage = "/partners/2d-sketch-cafe-banner.svg";
  const existingTop = await prisma.partnerBanner.findFirst({
    where: { storeId: store.id, slot: "HOME_TOP" },
  });
  if (existingTop) {
    await prisma.partnerBanner.update({
      where: { id: existingTop.id },
      data: {
        imageUrl: bannerImage,
        altText: "2D SKETCH CAFE — 부이비엔 포토스팟",
        isActive: true,
        sortOrder: 0,
      },
    });
  } else {
    await prisma.partnerBanner.create({
      data: {
        storeId: store.id,
        slot: "HOME_TOP",
        imageUrl: bannerImage,
        altText: "2D SKETCH CAFE — 부이비엔 포토스팟",
        isActive: true,
        sortOrder: 0,
      },
    });
  }

  const post = await prisma.post.upsert({
    where: { sourceUrl: SOURCE_URL },
    create: {
      title: seed.post.title,
      summary: seed.post.summary,
      content: POST_BODY,
      sourceUrl: SOURCE_URL,
      sourceName: seed.post.sourceName,
      topic: seed.post.topic,
      region: mapSeedRegion(seed.post.region),
      categoryId: category.id,
      publishedAt,
      status: "PUBLISHED",
      moderationStatus: "VISIBLE",
      isAutomated: false,
      isCrawl: false,
      storeName: seed.post.storeName,
    },
    update: {
      title: seed.post.title,
      summary: seed.post.summary,
      content: POST_BODY,
      categoryId: category.id,
      storeName: seed.post.storeName,
      status: "PUBLISHED",
      moderationStatus: "VISIBLE",
    },
  });

  console.log(`[seed-2d-sketch-cafe] OK`);
  console.log(`  LP: /store/${store.slug}`);
  console.log(`  글: /posts/${post.id}`);
  console.log(`  타임라인: /promo/timeline/2d-sketch-cafe`);
  console.log(`  홈 상단 배너: HOME_TOP → ${bannerImage}`);

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("[seed-2d-sketch-cafe] 실패", err);
  process.exit(1);
});
