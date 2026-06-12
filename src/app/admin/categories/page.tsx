import { CategoryMasterEditor } from "@/components/admin/category-master-editor";
import { getCategoryTreeForAdmin } from "@/lib/admin/categories-api";

export default async function AdminCategoriesPage() {
  const categories = await getCategoryTreeForAdmin();
  const sections = categories.filter((c) => !c.parentId);
  const children = categories.filter((c) => c.parentId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">카테고리 마스터</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          라벨 수정 · 노출 on/off · 순서 변경 · 서브 추가 (slug 고정)
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl bg-surface p-4">
          <p className="text-sm text-muted-foreground">1depth 섹션</p>
          <p className="mt-1 text-2xl font-bold">{sections.length}</p>
        </div>
        <div className="rounded-2xl bg-surface p-4">
          <p className="text-sm text-muted-foreground">2depth 서브</p>
          <p className="mt-1 text-2xl font-bold">{children.length}</p>
        </div>
        <div className="rounded-2xl bg-surface p-4">
          <p className="text-sm text-muted-foreground">공개 API</p>
          <p className="mt-1 truncate text-sm font-mono text-primary">
            GET /api/categories
          </p>
        </div>
      </div>

      <CategoryMasterEditor initial={categories} />
    </div>
  );
}
