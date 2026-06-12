"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Loader2,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/providers/toast-provider";
import { parseApiError } from "@/lib/api-response";
import { getCategoryIcon } from "@/lib/category-icons";
import { cn } from "@/lib/utils";

export type AdminCategoryRow = {
  id: string;
  slug: string;
  label: string;
  description: string | null;
  icon: string;
  colorClass: string;
  href: string;
  sortOrder: number;
  isActive: boolean;
  parentId: string | null;
  parent: { id: string; label: string; slug: string } | null;
  _count: { posts: number; children: number };
};

type Props = {
  initial: AdminCategoryRow[];
};

export function CategoryMasterEditor({ initial }: Props) {
  const router = useRouter();
  const { showToast } = useToast();
  const rows = initial;
  const [busyId, setBusyId] = useState<string | null>(null);
  const [newChildParentId, setNewChildParentId] = useState<string | null>(null);
  const [newSlug, setNewSlug] = useState("");
  const [newLabel, setNewLabel] = useState("");

  const sections = useMemo(
    () => rows.filter((r) => !r.parentId).sort((a, b) => a.sortOrder - b.sortOrder),
    [rows]
  );

  const childrenByParent = useMemo(() => {
    const map = new Map<string, AdminCategoryRow[]>();
    for (const r of rows.filter((x) => x.parentId)) {
      const list = map.get(r.parentId!) ?? [];
      list.push(r);
      map.set(r.parentId!, list);
    }
    for (const [, list] of map) {
      list.sort((a, b) => a.sortOrder - b.sortOrder);
    }
    return map;
  }, [rows]);

  async function patchCategory(
    id: string,
    data: Record<string, unknown>
  ): Promise<boolean> {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/categories/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const j = await res.json();
        showToast(parseApiError(j) ?? "저장 실패", "error");
        return false;
      }
      router.refresh();
      return true;
    } finally {
      setBusyId(null);
    }
  }

  async function reorderSiblings(
    parentId: string | null,
    ordered: AdminCategoryRow[]
  ) {
    setBusyId(parentId ?? "root");
    try {
      const res = await fetch("/api/admin/categories/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parentId,
          orderedIds: ordered.map((c) => c.id),
        }),
      });
      if (!res.ok) {
        const j = await res.json();
        showToast(parseApiError(j) ?? "순서 변경 실패", "error");
        return;
      }
      showToast("순서가 저장되었습니다.");
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  function moveInList(
    list: AdminCategoryRow[],
    id: string,
    dir: -1 | 1
  ) {
    const idx = list.findIndex((c) => c.id === id);
    const swap = idx + dir;
    if (idx < 0 || swap < 0 || swap >= list.length) return;
    const next = [...list];
    [next[idx], next[swap]] = [next[swap]!, next[idx]!];
    void reorderSiblings(list[0]?.parentId ?? null, next);
  }

  async function createChild() {
    if (!newChildParentId || !newSlug.trim() || !newLabel.trim()) return;
    setBusyId("create");
    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parentId: newChildParentId,
          slug: newSlug.trim(),
          label: newLabel.trim(),
        }),
      });
      if (!res.ok) {
        const j = await res.json();
        showToast(parseApiError(j) ?? "추가 실패", "error");
        return;
      }
      showToast("카테고리가 추가되었습니다.");
      setNewSlug("");
      setNewLabel("");
      setNewChildParentId(null);
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  function renderRow(cat: AdminCategoryRow, siblings: AdminCategoryRow[]) {
    const Icon = getCategoryIcon(cat.icon);
    const loading = busyId === cat.id;

    return (
      <div
        key={cat.id}
        className={cn(
          "flex flex-wrap items-center gap-2 rounded-xl border border-border px-3 py-2",
          !cat.isActive && "opacity-60"
        )}
      >
        <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
        <input
          className="min-w-[120px] flex-1 rounded-md border border-border px-2 py-1 text-sm"
          defaultValue={cat.label}
          onBlur={(e) => {
            if (e.target.value !== cat.label) {
              void patchCategory(cat.id, { label: e.target.value });
            }
          }}
        />
        <span className="font-mono text-xs text-muted-foreground">{cat.slug}</span>
        <span className="text-xs text-muted-foreground">
          글 {cat._count.posts}
        </span>
        <div className="ml-auto flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            disabled={loading}
            onClick={() => moveInList(siblings, cat.id, -1)}
          >
            <ChevronUp className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            disabled={loading}
            onClick={() => moveInList(siblings, cat.id, 1)}
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            disabled={loading}
            onClick={() =>
              void patchCategory(cat.id, { isActive: !cat.isActive })
            }
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : cat.isActive ? (
              <Eye className="h-4 w-4" />
            ) : (
              <EyeOff className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {sections.map((section) => {
        const children = childrenByParent.get(section.id) ?? [];
        return (
          <section key={section.id} className="rounded-2xl bg-surface p-4">
            <div className="mb-3 flex items-center gap-2">
              <span
                className={cn(
                  "rounded-md px-2 py-0.5 text-xs font-medium",
                  section.colorClass
                )}
              >
                {section.label}
              </span>
              <span className="text-xs text-muted-foreground">{section.slug}</span>
            </div>
            <div className="space-y-2">
              {renderRow(section, sections)}
              {children.map((c) => renderRow(c, children))}
            </div>
            {newChildParentId === section.id ? (
              <div className="mt-3 flex flex-wrap gap-2">
                <input
                  placeholder="slug (예: tips)"
                  className="rounded-md border border-border px-2 py-1 text-sm"
                  value={newSlug}
                  onChange={(e) => setNewSlug(e.target.value)}
                />
                <input
                  placeholder="라벨"
                  className="rounded-md border border-border px-2 py-1 text-sm"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                />
                <Button size="sm" onClick={() => void createChild()} disabled={busyId === "create"}>
                  저장
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setNewChildParentId(null)}
                >
                  취소
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => setNewChildParentId(section.id)}
              >
                <Plus className="mr-1 h-4 w-4" />
                서브 카테고리 추가
              </Button>
            )}
          </section>
        );
      })}
      <p className="text-xs text-muted-foreground">
        slug는 저장 후 변경할 수 없습니다. 전체 초기화는{" "}
        <code className="rounded bg-secondary px-1">npm run db:seed:categories -- --force-reset</code>
      </p>
    </div>
  );
}
