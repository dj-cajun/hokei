import { PrismaClient } from "../src/generated/prisma/client";

export type CategoryChildSeed = {
  slug: string;
  label: string;
  description: string;
  icon: string;
  sortOrder: number;
  children?: CategoryChildSeed[];
};

type SectionSeed = {
  slug: string;
  label: string;
  description: string;
  icon: string;
  colorClass: string;
  sortOrder: number;
  children: CategoryChildSeed[];
};

/** 호케이 최종 카테고리 마스터 (보스턴코리아 뼈대 + 호치민 현지화) */
export const CATEGORY_MASTER: SectionSeed[] = [
  {
    slug: "news",
    label: "뉴스",
    description:
      "호치민·베트남 현지 소식, 비자·교육·총영사관·한인회 공지 등 교민 필수 정보.",
    icon: "Newspaper",
    colorClass: "bg-red-50 text-red-600",
    sortOrder: 1,
    children: [
      {
        slug: "visa-residency",
        label: "비자 / 거주증 / 법인",
        description:
          "비자 변경, 거주증 발급, 로컬 법인 설립 등 교민 필수 규정 정보",
        icon: "ScrollText",
        sortOrder: 1,
      },
      {
        slug: "international-school",
        label: "국제학교 / 교육",
        description:
          "7군 푸미흥·2군 안푸 국제학교, 유학, 베트남어 학습 팁",
        icon: "GraduationCap",
        sortOrder: 2,
      },
      {
        slug: "consulate-association",
        label: "총영사관 / 한인회",
        description:
          "주호치민 총영사관·한인회·상공회의소 등 공식 공지 (원문 아웃링크)",
        icon: "Landmark",
        sortOrder: 3,
      },
    ],
  },
  {
    slug: "real-estate",
    label: "부동산 & 단기 임대",
    description:
      "단기 임대 플랫폼 비즈니스 연계. 아파트·한달살기·룸메이트 등 트래픽→수익 전환 핵심.",
    icon: "Building2",
    colorClass: "bg-emerald-50 text-emerald-600",
    sortOrder: 2,
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
  },
  {
    slug: "classifieds",
    label: "중고 거래",
    description:
      "가구·오토바이 등 장기 매물. 당일 찌라시는 AI 큐레이션으로 등록하세요.",
    icon: "Tags",
    colorClass: "bg-orange-50 text-orange-600",
    sortOrder: 3,
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
  },
  {
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
  },
  {
    slug: "jobs",
    label: "취업 & 비즈니스",
    description:
      "호치민 교민 생업 연계. 한국 기업·로컬 매장 채용 및 구직 프로필.",
    icon: "Briefcase",
    colorClass: "bg-blue-50 text-blue-600",
    sortOrder: 5,
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
  },
  {
    slug: "community",
    label: "소통 커뮤니티",
    description:
      "네이버 카페형 놀이터. 자유게시, 생존 Q&A.",
    icon: "MessageCircle",
    colorClass: "bg-purple-50 text-purple-600",
    sortOrder: 6,
    children: [
      {
        slug: "free-board",
        label: "교민 자유게시판",
        description: "생활 넋두리, 일상, 맛집 추천 등 자유 소통",
        icon: "MessagesSquare",
        sortOrder: 1,
      },
      {
        slug: "survival-qa",
        label: "생존 Q&A (질문방)",
        description:
          '"치과 어디가 좋나요?", "벌금 얼마?" 등 로컬 정착 정보 Q&A',
        icon: "HelpCircle",
        sortOrder: 2,
      },
    ],
  },
];

async function seedCategoryBranch(
  prisma: PrismaClient,
  parentId: string,
  sectionSlug: string,
  pathPrefix: string,
  colorClass: string,
  child: CategoryChildSeed
) {
  const href = `${pathPrefix}/${child.slug}`;
  const fullSlug = href
    .split("/")
    .filter(Boolean)
    .join("-");

  const row = await prisma.category.create({
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
      await seedCategoryBranch(
        prisma,
        row.id,
        sectionSlug,
        href,
        colorClass,
        grand
      );
    }
  }
}

export async function seedCategories(prisma: PrismaClient) {
  await prisma.category.deleteMany();

  for (const section of CATEGORY_MASTER) {
    const parent = await prisma.category.create({
      data: {
        slug: section.slug,
        label: section.label,
        description: section.description,
        icon: section.icon,
        colorClass: section.colorClass,
        href: `/${section.slug}`,
        sortOrder: section.sortOrder,
        isActive: true,
      },
    });

    for (const child of section.children) {
      await seedCategoryBranch(
        prisma,
        parent.id,
        section.slug,
        `/${section.slug}`,
        section.colorClass,
        child
      );
    }
  }
}
