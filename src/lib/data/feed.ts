import type { FeedItem } from "@/types/feed";

const today = "2026-06-01";

export const feedItems: FeedItem[] = [
  {
    id: "mock-1",
    category: "베트남 뉴스",
    categoryColor: "bg-red-50 text-red-600",
    title: "호치민 1군 지하철 2호선 공사 진행 상황 및 교통 우회 안내",
    date: "2시간 전",
    dateLabel: today,
    isNew: true,
    views: 1240,
    comments: 18,
    thumbnail:
      "https://images.unsplash.com/photo-1583417319070-4a5401d0a8e9?w=160&h=160&fit=crop",
  },
  {
    id: "mock-2",
    category: "숙소",
    categoryColor: "bg-emerald-50 text-emerald-600",
    title: "빈홈 7군 풀옵션 2BR 아파트 월세 $850 (관리비 포함)",
    date: "4시간 전",
    dateLabel: today,
    isNew: true,
    views: 892,
    comments: 24,
    thumbnail:
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=160&h=160&fit=crop",
  },
  {
    id: "mock-3",
    category: "구인",
    categoryColor: "bg-blue-50 text-blue-600",
    title: "[급구] 한국 식당 주방 보조 및 홀 서빙 스태프 채용 (비자 지원)",
    date: "5시간 전",
    dateLabel: today,
    isNew: true,
    views: 2103,
    comments: 42,
    thumbnail:
      "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=160&h=160&fit=crop",
  },
  {
    id: "mock-4",
    category: "퀴즈",
    categoryColor: "bg-amber-50 text-amber-600",
    title: "베트남 생활 필수! Grab 택시 요금 협상 & 팁 문화 총정리",
    date: "8시간 전",
    dateLabel: today,
    isNew: true,
    views: 3456,
    comments: 67,
    thumbnail:
      "https://images.unsplash.com/photo-1558618666-fcd25c85f933?w=160&h=160&fit=crop",
  },
  {
    id: "mock-5",
    category: "자유",
    categoryColor: "bg-purple-50 text-purple-600",
    title: "사이공 한인회 주말 바베큐 모임 참가자 모집합니다 (6/15)",
    date: "12시간 전",
    dateLabel: today,
    isNew: true,
    views: 567,
    comments: 31,
    thumbnail:
      "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=160&h=160&fit=crop",
  },
  {
    id: "mock-6",
    category: "베트남 뉴스",
    categoryColor: "bg-red-50 text-red-600",
    title: "2026년 베트남 공휴일 캘린더 및 한국 교민 근무 일정 참고",
    date: "1일 전",
    dateLabel: "2026-05-31",
    isNew: false,
    views: 1890,
    comments: 12,
    thumbnail:
      "https://images.unsplash.com/photo-1528183429752-a97d0bf99f60?w=160&h=160&fit=crop",
  },
  {
    id: "mock-7",
    category: "구인",
    categoryColor: "bg-blue-50 text-blue-600",
    title: "IT 스타트업 프론트엔드 개발자 (React) 원격/오피스 혼합",
    date: "1일 전",
    dateLabel: "2026-05-31",
    isNew: false,
    views: 1567,
    comments: 19,
    thumbnail:
      "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=160&h=160&fit=crop",
  },
  {
    id: "mock-8",
    category: "숙소",
    categoryColor: "bg-emerald-50 text-emerald-600",
    title: "탄빈 3군 원룸 단기 임대 (1~3개월) 보증금 협의 가능",
    date: "2일 전",
    dateLabel: "2026-05-30",
    isNew: false,
    views: 734,
    comments: 8,
  },
];

export const noticeItems: FeedItem[] = [
  {
    id: "notice-101",
    category: "공지",
    categoryColor: "bg-primary/10 text-primary",
    title: "[공지] 호케이 커뮤니티 이용 규칙 및 게시글 작성 가이드",
    date: "3일 전",
    dateLabel: "2026-05-29",
    isNew: false,
    views: 4521,
    comments: 5,
  },
  {
    id: "notice-102",
    category: "공지",
    categoryColor: "bg-primary/10 text-primary",
    title: "[공지] 2026년 6월 사이트 점검 일정 안내 (6/10 02:00~04:00)",
    date: "5일 전",
    dateLabel: "2026-05-27",
    isNew: false,
    views: 2890,
    comments: 2,
  },
];
