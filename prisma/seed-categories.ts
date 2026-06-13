import { PrismaClient } from "../src/generated/prisma/client";

type SectionSeed = {
  slug: string;
  label: string;
  description: string;
  icon: string;
  colorClass: string;
  sortOrder: number;
  children: {
    slug: string;
    label: string;
    description: string;
    icon: string;
    sortOrder: number;
  }[];
};

/** 호케이 최종 카테고리 마스터 (보스턴코리아 뼈대 + 호치민 현지화) */
export const CATEGORY_MASTER: SectionSeed[] = [
  {
    slug: "news",
    label: "뉴스",
    description:
      "호치민·베트남 현지 소식, 비자·교육·칼럼 등 교민 필수 정보.",
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
        slug: "column-opinion",
        label: "칼럼 / 오피니언",
        description: "현지 전문가 기고문 및 호치민 창업 수기",
        icon: "PenLine",
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
        slug: "apartment-rent",
        label: "아파트 렌트",
        description:
          "사이공펄, 빈홈 센트럴파크, 마스테리 등 한인 선호 아파트 장기 임대",
        icon: "Home",
        sortOrder: 1,
      },
      {
        slug: "short-term-rent",
        label: "단기 임대 / 한달살기",
        description: "출장·여행 1~3개월 미만 단기 숙소 및 쉐어하우스",
        icon: "CalendarRange",
        sortOrder: 2,
      },
      {
        slug: "roommate",
        label: "룸메이트 구함",
        description: "다방 아파트에서 함께 살 룸메이트 실속 매물",
        icon: "Users",
        sortOrder: 3,
      },
    ],
  },
  {
    slug: "classifieds",
    label: "중고 거래",
    description:
      "교민 중고 장터. 가구·오토바이·업소 홍보 등 매일 올라오는 거래 글.",
    icon: "Tags",
    colorClass: "bg-orange-50 text-orange-600",
    sortOrder: 3,
    children: [
      {
        slug: "buy-sell",
        label: "사고 팔고 (중고장터)",
        description: "가구, 가전, 이사·귀국 정리 물품 거래",
        icon: "Package",
        sortOrder: 1,
      },
      {
        slug: "motorcycle-car",
        label: "오토바이 / 자동차",
        description:
          "베스파, 혼다 비전 등 중고 바이크·차량 직거래 (현지 필수 이동수단)",
        icon: "Bike",
        sortOrder: 2,
      },
      {
        slug: "business-promo",
        label: "업소 홍보 / 장터",
        description: "반찬 가게, 공동구매, 교민 대상 소형 서비스 홍보",
        icon: "Store",
        sortOrder: 3,
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
    sortOrder: 4,
    children: [
      {
        slug: "hiring",
        label: "구인 (직원 채용)",
        description:
          "베트남 진출 한국 기업, 호치민 로컬 매장·학원 한국인/베트남인 채용",
        icon: "UserPlus",
        sortOrder: 1,
      },
      {
        slug: "job-seeking",
        label: "구직 (일자리 찾기)",
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
      "네이버 카페형 놀이터. 자유게시, 생존 Q&A, 한인 업소록.",
    icon: "MessageCircle",
    colorClass: "bg-purple-50 text-purple-600",
    sortOrder: 5,
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
      {
        slug: "yellow-pages",
        label: "호치민 업소록 (옐로우페이지)",
        description: "한인 식당, 병원, 정비소, 미용실 업종별 연락처 아카이브",
        icon: "BookOpen",
        sortOrder: 3,
      },
    ],
  },
];

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
      await prisma.category.create({
        data: {
          slug: `${section.slug}-${child.slug}`,
          label: child.label,
          description: child.description,
          icon: child.icon,
          colorClass: section.colorClass,
          href: `/${section.slug}/${child.slug}`,
          sortOrder: child.sortOrder,
          parentId: parent.id,
          isActive: true,
        },
      });
    }
  }
}
