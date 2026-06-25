"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { LIFE_DOMAIN_LABELS, LIFE_WIKI_DOMAIN_ORDER } from "@/lib/life/labels";
import type { LifeDomain } from "@/generated/prisma/client";
import { cn } from "@/lib/utils";

const domains = ["all", ...LIFE_WIKI_DOMAIN_ORDER] as const;

export function LifeDomainFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const current = searchParams.get("domain") ?? "all";

  function setDomain(domain: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (domain === "all") params.delete("domain");
    else params.set("domain", domain);
    const qs = params.toString();
    router.push(qs ? `/life?${qs}` : "/life");
  }

  return (
    <div className="flex flex-wrap gap-1 border-b border-border-light px-3 py-2">
      {domains.map((d) => (
        <button
          key={d}
          type="button"
          onClick={() => setDomain(d)}
          className={cn(
            "rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors",
            current === d
              ? "bg-primary text-white"
              : "bg-muted text-muted-foreground hover:bg-card-hover"
          )}
        >
          {d === "all" ? "전체" : LIFE_DOMAIN_LABELS[d as LifeDomain]}
        </button>
      ))}
    </div>
  );
}
