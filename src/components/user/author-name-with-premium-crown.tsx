import { Crown } from "lucide-react";
import { cn } from "@/lib/utils";

type AuthorNameWithPremiumCrownProps = {
  name: string;
  showPremiumCrown?: boolean;
  className?: string;
};

/** 프리미엄 제휴 업소 사장님 — 이름 앞 왕관 */
export function AuthorNameWithPremiumCrown({
  name,
  showPremiumCrown = false,
  className,
}: AuthorNameWithPremiumCrownProps) {
  if (!showPremiumCrown) {
    return <span className={className}>{name}</span>;
  }

  return (
    <span className={cn("inline-flex items-center gap-0.5", className)}>
      <Crown
        className="h-3 w-3 shrink-0 text-amber-500"
        aria-hidden
      />
      <span>{name}</span>
      <span className="sr-only">프리미엄 업체</span>
    </span>
  );
}
