import type { PostTopic } from "@/generated/prisma/client";

/** 수집 토픽 기본값 — 키워드 매칭 실패 시 */
export const DEFAULT_TOPIC_CATEGORY_SLUG: Record<PostTopic, string> = {
  KOREA: "news",
  TRAVEL: "news",
  VIETNAM_POLICY: "news-visa-residency",
  TOURIST: "news",
};

const VISA_POLICY =
  /비자|visa|거주|이민|immigration|residency|체류|입국|영주|work permit|노동허가|외국인|expat|정책|policy|quarantine|세관|customs|규정|법률|permit|E-?visa|TTDH|거주증|체류연장|임시체류|법인|검역|amnesty|사면/i;

const EDUCATION =
  /국제학교|학교|교육|유학|학원|입학|학비|캠퍼스|international school|education|tuition|enrollment|ISHCMC|BIS|AIS|UNIS|kindergarten|유치원/i;

const COLUMN_OPINION =
  /칼럼|오피니언|기고|에세이|창업 수기|column|opinion|editorial|교민|커뮤니티|단톡|카톡/i;

const JOBS_BUSINESS =
  /구인|구직|채용|일자리|창업|진출|투자|FDI|기업|공장|산업단지|hiring|recruit|startup|business/i;

export type ResolveNewsCategoryInput = {
  topic: PostTopic;
  title: string;
  summary?: string;
  sourceName?: string;
};

/**
 * 자동 뉴스 → DB 하위 카테고리 slug
 * 1) 제목·요약 키워드  2) 토픽 기본값
 */
export function resolveNewsCategorySlug(
  input: ResolveNewsCategoryInput
): string {
  const text = [input.title, input.summary, input.sourceName]
    .filter(Boolean)
    .join(" ")
    .trim();

  if (VISA_POLICY.test(text) || input.topic === "VIETNAM_POLICY") {
    return "news-visa-residency";
  }
  if (EDUCATION.test(text)) {
    return "news-international-school";
  }
  if (COLUMN_OPINION.test(text)) {
    return "news-column-opinion";
  }
  if (input.topic === "KOREA" && JOBS_BUSINESS.test(text)) {
    return "news";
  }

  return DEFAULT_TOPIC_CATEGORY_SLUG[input.topic] ?? "news";
}
