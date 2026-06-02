import { NewsIngestPanel } from "@/components/admin/news-ingest-panel";
import { NewsSourcesPanel } from "@/components/admin/news-sources-panel";
import { IngestRunsPanel } from "@/components/admin/ingest-runs-panel";
import { StorageMetricsPanel } from "@/components/admin/storage-metrics-panel";
import { computeAttachmentStats, getRecentStorageSnapshots } from "@/lib/admin/storage-metrics";
import { ensureNewsSourcesSeeded } from "@/lib/news/seed-sources-config";
import { prisma } from "@/lib/prisma";

export default async function AdminIngestPage() {
  await ensureNewsSourcesSeeded();
  const runs = await prisma.newsIngestRun.findMany({
    orderBy: { runAt: "desc" },
    take: 40,
  });

  const [current, snapshots] = await Promise.all([
    computeAttachmentStats(),
    getRecentStorageSnapshots(30),
  ]);

  const initialRuns = runs.map((r) => ({
    id: r.id,
    runAt: r.runAt.toISOString(),
    inserted: r.inserted,
    skipped: r.skipped,
    errors: r.errors,
    errorDetails: r.errorDetails,
    durationMs: r.durationMs,
    triggeredBy: r.triggeredBy,
    timezone: r.timezone,
  }));
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">뉴스 수집 관제</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          수동 실행 · 소스 관리 · 수집 로그 · 첨부 용량
        </p>
      </div>
      <NewsIngestPanel />
      <NewsSourcesPanel />
      <StorageMetricsPanel
        initialCurrent={current}
        initialSnapshots={snapshots.map((s) => ({
          takenAt: s.takenAt.toISOString(),
          attachmentBytes: s.attachmentBytes,
          attachmentCount: s.attachmentCount,
        }))}
      />
      <IngestRunsPanel initialRuns={initialRuns} />
    </div>
  );
}
