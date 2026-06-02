import { enforcePreset } from "@/lib/api/enforce-rate-limit";
import { apiSuccess } from "@/lib/api-response";
import { requireAdminApi } from "@/lib/admin/require-admin-api";
import {
  computeAttachmentStats,
  getRecentStorageSnapshots,
  recordStorageSnapshot,
} from "@/lib/admin/storage-metrics";
import { writeAdminAudit } from "@/lib/admin/audit-log";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const limited = await enforcePreset(request, "general");
  if (limited) return limited;
  const { error } = await requireAdminApi();
  if (error) return error;

  const [current, snapshots] = await Promise.all([
    computeAttachmentStats(),
    getRecentStorageSnapshots(30),
  ]);

  return apiSuccess({
    current,
    snapshots: snapshots.map((s) => ({
      ...s,
      takenAt: s.takenAt.toISOString(),
    })),
  });
}

export async function POST(request: Request) {
  const limited = await enforcePreset(request, "general");
  if (limited) return limited;
  const { session, error } = await requireAdminApi();
  if (error) return error;

  const snapshot = await recordStorageSnapshot();

  await writeAdminAudit({
    actorId: session!.user!.id,
    action: "STORAGE_SNAPSHOT",
    targetType: "StorageSnapshot",
    targetId: snapshot.id,
    request,
  });

  return apiSuccess({
    snapshot: {
      ...snapshot,
      takenAt: snapshot.takenAt.toISOString(),
    },
  });
}
