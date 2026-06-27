import { enforcePreset } from "@/lib/api/enforce-rate-limit";
import { apiSuccess } from "@/lib/api-response";
import { requireAdminApi } from "@/lib/admin/require-admin-api";
import { getPartnerEventSummary } from "@/lib/partner/queries";

export const dynamic = "force-dynamic";

const SUMMARY_DAYS = 30;

export async function GET(request: Request) {
  const limited = await enforcePreset(request, "general");
  if (limited) return limited;
  const { error } = await requireAdminApi();
  if (error) return error;

  const since = new Date();
  since.setDate(since.getDate() - SUMMARY_DAYS);

  const summary = await getPartnerEventSummary(since);
  const stats: Record<string, { views: number; clicks: number; total: number }> =
    {};
  for (const [storeId, counts] of summary) {
    stats[storeId] = counts;
  }

  return apiSuccess({ stats, sinceDays: SUMMARY_DAYS });
}
