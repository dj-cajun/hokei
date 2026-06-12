import { getRegionLabel } from "@/lib/regions";

export function RegionBadge({ region }: { region?: string | null }) {
  const label = getRegionLabel(region);
  if (!label) return null;

  return (
    <span className="shrink-0 rounded bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
      {label}
    </span>
  );
}
