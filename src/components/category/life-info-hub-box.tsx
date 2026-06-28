import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** 찐 생활정보 허브 — 타이틀·4칸 배너바 동일 외곽 높이 */
export const LIFE_INFO_HUB_STRIP_CLASS =
  "flex h-20 items-center bg-surface px-2 lg:h-24 lg:rounded-xl lg:px-5";

/** 4칸 그리드 셀 — 동일 크기·아웃라인 (다크: 배경 없음) */
export const LIFE_INFO_HUB_CELL_CLASS =
  "relative flex h-full min-h-0 items-center justify-center overflow-hidden rounded-lg border border-border-light bg-surface shadow-sm dark:border-border dark:bg-transparent dark:shadow-none";

export function LifeInfoHubStrip({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn(LIFE_INFO_HUB_STRIP_CLASS, className)}>{children}</div>
  );
}

/** @deprecated LifeInfoHubStrip 사용 */
export function LifeInfoHubBox({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <LifeInfoHubStrip className={className}>{children}</LifeInfoHubStrip>;
}
