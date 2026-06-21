/**
 * NewsIngestRun 최근 이력 — skip 사유·수집 메타 집계
 *
 * npm run news:analyze-ingest
 * npm run news:analyze-ingest -- --neon
 */
import {
  openNeonPrisma,
  restoreLocalSqlitePrisma,
} from "./lib/neon-bootstrap";
import {
  aggregateSkipReasons,
  parseIngestErrorDetails,
} from "../src/lib/news/ingest-skip-stats";

const useNeon = process.argv.includes("--neon");
const limitArg = process.argv.find((a) => a.startsWith("--limit="));
const limit = limitArg
  ? Math.min(100, Math.max(1, Number.parseInt(limitArg.split("=")[1] ?? "20", 10)))
  : 20;

async function main() {
  if (useNeon) {
    await openNeonPrisma();
  }

  const { prisma } = await import("../src/lib/prisma");

  const runs = await prisma.newsIngestRun.findMany({
    take: limit,
    orderBy: { runAt: "desc" },
  });

  if (runs.length === 0) {
    console.log("NewsIngestRun 기록이 없습니다.");
    return;
  }

  console.log(`\n=== NewsIngestRun 최근 ${runs.length}건 ===\n`);

  let totalInserted = 0;
  let totalSkipped = 0;
  const globalSkipStats: Record<string, number> = {};
  const zeroInsertRuns: typeof runs = [];

  for (const run of runs) {
    totalInserted += run.inserted;
    totalSkipped += run.skipped;
    if (run.inserted === 0) zeroInsertRuns.push(run);

    const details = parseIngestErrorDetails(run.errorDetails);
    const skipStats = details?.skipStats ?? {};
    for (const [reason, count] of Object.entries(skipStats)) {
      globalSkipStats[reason] = (globalSkipStats[reason] ?? 0) + count;
    }

    const meta = details?.meta as Record<string, unknown> | undefined;
    const metaLine = meta
      ? `pool=${meta.poolSize ?? "?"} candidates=${meta.candidates ?? "?"} rssOnly=${meta.rssOnly ?? "?"}`
      : "";

    console.log(
      `${run.runAt.toISOString()} | +${run.inserted} skip=${run.skipped} | ${run.durationMs ?? "?"}ms | ${run.triggeredBy ?? "-"}`
    );
    if (metaLine) console.log(`  ${metaLine}`);
    if (run.inserted === 0 && run.errors) {
      const firstLines = run.errors.split("\n").slice(0, 3);
      for (const line of firstLines) {
        console.log(`  → ${line.slice(0, 120)}`);
      }
    }
  }

  console.log("\n--- 집계 ---");
  console.log(`총 inserted: ${totalInserted}, skipped: ${totalSkipped}`);
  console.log(`0건 수집 run: ${zeroInsertRuns.length}/${runs.length}`);

  if (Object.keys(globalSkipStats).length > 0) {
    console.log("\nSkip 사유 (누적):");
    const sorted = Object.entries(globalSkipStats).sort((a, b) => b[1] - a[1]);
    for (const [reason, count] of sorted) {
      console.log(`  ${reason}: ${count}`);
    }
  } else {
    console.log("\n(errorDetails.skipStats 없음 — 구버전 run 또는 skip 없음)");
    const legacyMessages = runs.flatMap((r) =>
      (r.errors ?? "").split("\n").filter((l) => l.includes("[") && l.includes("]"))
    );
    if (legacyMessages.length > 0) {
      const legacy = aggregateSkipReasons(legacyMessages);
      console.log("errors 필드에서 추출:");
      for (const [reason, count] of Object.entries(legacy).sort(
        (a, b) => b[1] - a[1]
      )) {
        console.log(`  ${reason}: ${count}`);
      }
    }
  }

  const last = runs[0]!;
  const lastDetails = parseIngestErrorDetails(last.errorDetails);
  if (lastDetails?.issues?.length) {
    console.log("\n최근 run 이슈 샘플 (최대 5):");
    for (const issue of lastDetails.issues.slice(0, 5)) {
      console.log(`  • ${issue.message.slice(0, 140)}`);
    }
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    if (useNeon) await restoreLocalSqlitePrisma();
  });
