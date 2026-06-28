"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import type { LifeGuideListItem } from "@/lib/life/guides";
import { AdminLifeGuideDeleteButton } from "@/components/life/admin-life-guide-delete-button";

type LifeGuideStudyListProps = {
  items: LifeGuideListItem[];
  emptyMessage?: string;
};

export function LifeGuideStudyList({
  items,
  emptyMessage = "아직 등록된 표현이 없습니다.",
}: LifeGuideStudyListProps) {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";

  if (items.length === 0) {
    return (
      <p className="px-3 py-6 text-center text-sm text-muted-foreground">
        {emptyMessage}
      </p>
    );
  }

  return (
    <div className="divide-y divide-border-light">
      {isAdmin && (
        <p className="bg-amber-50 px-3 py-2 text-[11px] text-amber-800">
          관리자: 각 항목 오른쪽 삭제 버튼으로 베트남어 공부 글을 제거할 수
          있습니다.
        </p>
      )}
      {items.map((item) => (
        <div key={item.id} className="flex items-start gap-2 px-3 py-3">
          <Link
            href={`/life/${item.slug}`}
            className="min-w-0 flex-1 transition-colors hover:text-primary"
          >
            <p className="text-sm font-medium">{item.title}</p>
            {item.vnText && (
              <p className="mt-1 line-clamp-2 text-xs text-primary">
                {item.vnText}
              </p>
            )}
          </Link>
          <AdminLifeGuideDeleteButton
            guideId={item.id}
            title={item.title}
            compact
          />
        </div>
      ))}
    </div>
  );
}
