import Link from "next/link";
import { ChevronRight, ExternalLink, Store } from "lucide-react";

type AdminQuickLinksProps = {
  partnerStoreCount: number;
  publishedPartnerCount: number;
};

export function AdminQuickLinks({
  partnerStoreCount,
  publishedPartnerCount,
}: AdminQuickLinksProps) {
  return (
    <section className="rounded-2xl bg-surface">
      <div className="border-b border-border px-5 py-4">
        <h2 className="font-semibold">빠른 이동</h2>
      </div>
      <div className="grid gap-3 p-5 sm:grid-cols-2">
        <Link
          href="/admin/partners"
          className="group flex items-center justify-between rounded-xl border border-border-light bg-secondary/30 px-4 py-3 transition-colors hover:border-primary/30 hover:bg-accent/40"
        >
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent text-primary">
              <Store className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-semibold">제휴 업소 (파트너스)</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                등록 {partnerStoreCount}곳 · 공개 {publishedPartnerCount}곳
              </p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
        </Link>

        <Link
          href="/partners"
          target="_blank"
          className="group flex items-center justify-between rounded-xl border border-border-light px-4 py-3 transition-colors hover:border-primary/30 hover:bg-secondary/40"
        >
          <div>
            <p className="text-sm font-medium">공개 파트너스 목록</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              /partners — 방문자 화면 미리보기
            </p>
          </div>
          <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
        </Link>
      </div>
    </section>
  );
}
