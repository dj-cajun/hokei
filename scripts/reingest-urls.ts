/**
 * 삭제된 뉴스 URL 수동 재수집
 * npx tsx scripts/reingest-urls.ts --neon
 */
import { loadDotenv } from "../src/lib/load-dotenv";

loadDotenv();

import { buildPostFromArticlePage } from "../src/lib/news/ingest-article";
import { passesTopicRelevanceFilter } from "../src/lib/news/topic-relevance";
import { hasSubstantialNewsBody } from "../src/lib/news/news-body-quality";
import { resolveNewsCategorySlug } from "../src/lib/news/resolve-news-category";
import { sanitizeStoredSourceName } from "../src/lib/news/source-display";
import { toKoreanPublisherArticleUrl } from "../src/lib/news/korean-publisher-url";
import { indexPostInSearch } from "../src/lib/search/index-post";
import type { RawNewsItem } from "../src/lib/news/rss";

/** prune-off-topic으로 삭제됐으나 교민 가치가 있는 4건 (#8·#15 제외) */
const REINGEST_ITEMS: Pick<
  RawNewsItem,
  "link" | "title" | "sourceName" | "topic" | "description"
>[] = [
  {
    link: "https://www.thisisgame.com/articles/406828",
    title: "[단독 인터뷰] 베트남 게임 콘트롤타워, 한국과 함께 가고 싶다",
    sourceName: "디스이즈게임",
    topic: "KOREA",
    description: "베트남 게임 산업과 한국 협력",
  },
  {
    link: "https://www.insidevina.com/news/articleView.html?idxno=43378",
    title:
      "[베트남 송금 가계부] 환율 올라도 물가가 슥삭…쌀국수 1그릇 줄어드는 데 그쳐",
    sourceName: "인사이드비나",
    topic: "VIETNAM_POLICY",
    description: "호치민 생활비·송금",
  },
  {
    link: "https://www.insidevina.com/news/articleView.html?idxno=43374",
    title:
      "베트남항공, '정시운항률' 대한항공 제치고 아시아 3위 올라…英시리움",
    sourceName: "인사이드비나",
    topic: "TRAVEL",
    description: "베트남항공 운항",
  },
  {
    link: "https://www.hyundaimotorgroup.com/ko/news/hyundai-rotem-vietnam-rail-market-entry",
    title:
      "현대차, 베트남 1,024km 철도망 구축 위한 지하철 열차 건설 지원",
    sourceName: "현대자동차그룹",
    topic: "KOREA",
    description: "현대로템 베트남 메트로·철도",
  },
];

async function loadCategoryMap() {
  const { prisma } = await import("../src/lib/prisma");
  const categories = await prisma.category.findMany({
    where: {
      OR: [{ slug: "news" }, { slug: { startsWith: "news-" } }],
    },
    select: { id: true, slug: true },
  });
  return new Map(categories.map((c) => [c.slug, c.id]));
}

async function reingest() {
  const { prisma } = await import("../src/lib/prisma");
  const categoryMap = await loadCategoryMap();
  const result = { inserted: 0, skipped: 0, errors: [] as string[] };

  for (const item of REINGEST_ITEMS) {
    const link = toKoreanPublisherArticleUrl(item.link, item.sourceName);
    const existing = await prisma.post.findFirst({
      where: { status: "PUBLISHED", sourceUrl: link },
      select: { id: true, title: true },
    });
    if (existing) {
      result.skipped++;
      result.errors.push(`${link}: 이미 존재 (${existing.title.slice(0, 50)})`);
      console.log("SKIP (exists):", existing.title.slice(0, 60));
      continue;
    }

    try {
      const { title, content, thumbnail, bodySkip } =
        await buildPostFromArticlePage(
          { ...item, link },
          { fetchTimeoutMs: 45_000 }
        );

      if (
        content &&
        !passesTopicRelevanceFilter(item.topic, title, content.slice(0, 800), {
          link,
          sourceName: item.sourceName,
        })
      ) {
        result.skipped++;
        result.errors.push(`${link}: [off_topic] 주제 필터 불통과`);
        console.log("SKIP (off_topic):", title.slice(0, 60));
        continue;
      }

      if (!hasSubstantialNewsBody(content)) {
        result.skipped++;
        const reason = bodySkip?.reason ?? "no_body";
        result.errors.push(`${link}: [${reason}] 본문 부족`);
        console.log("SKIP (no_body):", title.slice(0, 60));
        continue;
      }

      const summaryText =
        (content ?? "").replace(/\s+/g, " ").trim().slice(0, 160) || title;
      const categorySlug = resolveNewsCategorySlug({
        topic: item.topic,
        title,
        summary: summaryText,
        sourceName: item.sourceName,
      });
      const categoryId =
        categoryMap.get(categorySlug) ?? categoryMap.get("news");
      if (!categoryId) {
        result.skipped++;
        result.errors.push(`${link}: 카테고리 없음`);
        continue;
      }

      const post = await prisma.post.create({
        data: {
          title,
          summary: summaryText,
          content,
          sourceUrl: link,
          sourceName: sanitizeStoredSourceName(item.sourceName),
          topic: item.topic,
          categoryId,
          originalTitle: item.title,
          thumbnail,
          publishedAt: new Date(),
          isAutomated: true,
          status: "PUBLISHED",
        },
      });

      await indexPostInSearch({
        id: post.id,
        title: post.title,
        summary: post.summary,
        content: post.content,
        status: post.status,
      });

      result.inserted++;
      console.log("OK:", title.slice(0, 70));
    } catch (err) {
      result.skipped++;
      const msg = err instanceof Error ? err.message : String(err);
      result.errors.push(`${link}: ${msg}`);
      console.log("ERR:", link, msg);
    }
  }

  console.log(JSON.stringify(result, null, 2));
  await prisma.$disconnect();
}

async function main() {
  const useNeon = process.argv.includes("--neon");
  if (useNeon) {
    const { openNeonPrisma, restoreLocalSqlitePrisma } = await import(
      "./lib/neon-bootstrap"
    );
    await openNeonPrisma();
    try {
      await reingest();
    } finally {
      restoreLocalSqlitePrisma();
    }
    return;
  }
  await reingest();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
