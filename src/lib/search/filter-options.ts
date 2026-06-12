import { isValidRegion } from "@/lib/regions";

export type SearchPeriod = "all" | "today" | "week" | "month";
export type SearchSort = "relevance" | "recent";
export type SearchSection =
  | "all"
  | "news"
  | "community"
  | "real-estate"
  | "jobs";

export type SearchFilters = {
  section?: SearchSection;
  period?: SearchPeriod;
  sort?: SearchSort;
  region?: string;
};

export function parseSearchFilters(params: {
  section?: string;
  period?: string;
  sort?: string;
  region?: string;
}): SearchFilters {
  const section = (
    ["all", "news", "community", "real-estate", "jobs"] as const
  ).includes(params.section as SearchSection)
    ? (params.section as SearchSection)
    : "all";

  const period = (["all", "today", "week", "month"] as const).includes(
    params.period as SearchPeriod
  )
    ? (params.period as SearchPeriod)
    : "all";

  const sort = params.sort === "recent" ? "recent" : "relevance";

  const region =
    params.region && isValidRegion(params.region) ? params.region : undefined;

  return { section, period, sort, region };
}

export function periodCutoff(period: SearchPeriod): Date | null {
  if (period === "all") return null;
  const now = new Date();
  const hcm = new Date(
    now.toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" })
  );
  if (period === "today") {
    hcm.setHours(0, 0, 0, 0);
    return hcm;
  }
  if (period === "week") {
    return new Date(now.getTime() - 7 * 86_400_000);
  }
  return new Date(now.getTime() - 30 * 86_400_000);
}
