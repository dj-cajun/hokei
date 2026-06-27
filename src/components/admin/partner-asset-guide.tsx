import {
  PARTNER_ASSET_GUIDE,
  type PartnerAssetGuideKey,
} from "@/lib/partner/asset-guide";

type Props = {
  /** 표시할 항목만 (기본: 전체) */
  keys?: PartnerAssetGuideKey[];
  className?: string;
};

export function PartnerAssetGuideBox({ keys, className = "" }: Props) {
  const entries = keys
    ? keys.map((key) => [key, PARTNER_ASSET_GUIDE[key]] as const)
    : (Object.entries(PARTNER_ASSET_GUIDE) as [
        PartnerAssetGuideKey,
        (typeof PARTNER_ASSET_GUIDE)[PartnerAssetGuideKey],
      ][]);

  return (
    <div
      className={`rounded-md border border-border-light bg-secondary/30 px-3 py-2 text-[11px] text-muted-foreground ${className}`}
    >
      <p className="mb-1.5 font-semibold text-foreground">이미지 사이즈 가이드</p>
      <ul className="space-y-1.5">
        {entries.map(([key, g]) => (
          <li key={key}>
            <span className="font-medium text-foreground">{g.label}</span>
            <span className="block">{g.size}</span>
            <span className="block text-[10px]">{g.note}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
