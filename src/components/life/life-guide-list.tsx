import Link from "next/link";
import type { LifeGuideListItem } from "@/lib/life/guides";
import { LIFE_DOMAIN_LABELS, LIFE_KIND_LABELS } from "@/lib/life/labels";

type LifeGuideListProps = {
  items: LifeGuideListItem[];
  emptyMessage?: string;
};

export function LifeGuideList({
  items,
  emptyMessage = "등록된 생활 가이드가 없습니다.",
}: LifeGuideListProps) {
  if (items.length === 0) {
    return (
      <p className="px-3 py-6 text-center text-sm text-muted-foreground">
        {emptyMessage}
      </p>
    );
  }

  return (
    <div className="divide-y divide-border-light">
      {items.map((item) => (
        <Link
          key={item.id}
          href={`/life/${item.slug}`}
          className="block px-3 py-3 transition-colors hover:bg-card-hover"
        >
          <p className="text-[10px] text-muted-foreground">
            {LIFE_KIND_LABELS[item.kind]} · {LIFE_DOMAIN_LABELS[item.domain]}
          </p>
          <p className="mt-0.5 text-sm font-medium">{item.title}</p>
          {item.vnText && (
            <p className="mt-1 line-clamp-2 text-xs text-primary">{item.vnText}</p>
          )}
        </Link>
      ))}
    </div>
  );
}
