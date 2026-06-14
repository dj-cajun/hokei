/**
 * 프로덕션 뉴스 수집 런치 점검
 * npm run news:check:prod
 */
import { config } from "dotenv";
import {
  openNeonPrisma,
  pingNeonDb,
  restoreLocalSqlitePrisma,
} from "./lib/neon-bootstrap";

const neon = process.argv.includes("--neon");
if (neon) {
  config({ path: ".env.production.pg", override: true });
} else {
  config({ path: ".env" });
}

async function main() {
  const url = process.env.DATABASE_URL?.trim() ?? "";
  const isPg =
    url.startsWith("postgresql://") || url.startsWith("postgres://");

  let prisma: import("../src/generated/prisma/client").PrismaClient;
  if (neon && isPg) {
    prisma = await openNeonPrisma();
    await pingNeonDb(prisma, "check-ingest");
  } else {
    ({ prisma } = await import("../src/lib/prisma"));
  }

  try {
    const { assessIngestReadiness } = await import(
      "../src/lib/news/ingest-runtime"
    );
    const { newsAutomatedWhere } = await import(
      "../src/lib/news/news-list-where"
    );

    const readiness = await assessIngestReadiness();

    let schemaOk = true;
    const schemaIssues: string[] = [];

    if (isPg) {
      try {
        await prisma.post.findFirst({
          select: { id: true, likeCount: true },
        });
        await prisma.newsIngestRun.findFirst({ select: { id: true } });
      } catch (e) {
        schemaOk = false;
        schemaIssues.push(e instanceof Error ? e.message : String(e));
      }
    }

    const [autoCount, newsCount, categoryCount] = await Promise.all([
      prisma.post.count({ where: { isAutomated: true, status: "PUBLISHED" } }),
      prisma.post.count({ where: newsAutomatedWhere }),
      prisma.category.count({
        where: {
          OR: [{ slug: "news" }, { slug: { startsWith: "news-" } }],
        },
      }),
    ]);

    const today = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Ho_Chi_Minh",
    }).format(new Date());
    const start = new Date(`${today}T00:00:00+07:00`);
    const end = new Date(start.getTime() + 86_400_000);
    const todayIngested = await prisma.post.count({
      where: {
        isAutomated: true,
        ingestedAt: { gte: start, lt: end },
      },
    });

    const [lastRun, cronRunCount] = await Promise.all([
      prisma.newsIngestRun.findFirst({
        orderBy: { runAt: "desc" },
        select: {
          runAt: true,
          inserted: true,
          skipped: true,
          triggeredBy: true,
          errors: true,
        },
      }),
      prisma.newsIngestRun.count({ where: { triggeredBy: "cron" } }),
    ]);

    const ok = readiness.ok && schemaOk && categoryCount > 0;

    const report = {
      ok,
      hcmToday: today,
      todayIngested,
      automatedPublished: autoCount,
      newsListCount: newsCount,
      newsCategories: categoryCount,
      database: isPg ? "postgresql" : "sqlite",
      ingest: readiness,
      schema: { ok: schemaOk, issues: schemaIssues },
      cronRunCount,
      lastRun,
      cronSchedule: "07:00·12:00 Asia/Ho_Chi_Minh (UTC 0:00·5:00)",
    };

    console.log(JSON.stringify(report, null, 2));
    if (!ok) process.exit(1);
  } finally {
    await prisma.$disconnect();
    if (neon && isPg) {
      restoreLocalSqlitePrisma();
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
