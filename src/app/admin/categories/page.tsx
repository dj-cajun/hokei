import { getAllCategoriesFlat } from "@/lib/categories";
import { getCategoryIcon } from "@/lib/category-icons";

export default async function AdminCategoriesPage() {
  const categories = await getAllCategoriesFlat();

  const sections = categories.filter((c) => !c.parentId);
  const children = categories.filter((c) => c.parentId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">카테고리 마스터</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          보스턴코리아형 5대 섹션 · 호치민 현지 서브 {children.length}개 (DB
          동기화)
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl bg-white p-4">
          <p className="text-sm text-muted-foreground">1depth 섹션</p>
          <p className="mt-1 text-2xl font-bold">{sections.length}</p>
        </div>
        <div className="rounded-2xl bg-white p-4">
          <p className="text-sm text-muted-foreground">2depth 서브</p>
          <p className="mt-1 text-2xl font-bold">{children.length}</p>
        </div>
        <div className="rounded-2xl bg-white p-4">
          <p className="text-sm text-muted-foreground">API</p>
          <p className="mt-1 truncate text-sm font-mono text-primary">
            GET /api/categories
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="px-4 py-3 font-medium">구분</th>
                <th className="px-4 py-3 font-medium">라벨</th>
                <th className="px-4 py-3 font-medium">slug</th>
                <th className="px-4 py-3 font-medium">URL</th>
                <th className="px-4 py-3 font-medium">순서</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => {
                const Icon = getCategoryIcon(cat.icon);
                const isSection = !cat.parentId;
                return (
                  <tr
                    key={cat.id}
                    className="border-b border-border last:border-0"
                  >
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        <span
                          className={`rounded-md px-1.5 py-0.5 text-xs ${cat.colorClass}`}
                        >
                          {isSection ? "섹션" : cat.parent?.label}
                        </span>
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium">{cat.label}</td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                      {cat.slug}
                    </td>
                    <td className="px-4 py-3 text-xs text-primary">{cat.href}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {cat.sortOrder}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
