import { Sidebar } from "@/components/layout/sidebar";

interface CategoryPageProps {
  title: string;
  description: string;
}

export function CategoryPage({ title, description }: CategoryPageProps) {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 gap-6 px-4 py-6">
      <Sidebar />
      <div className="min-w-0 flex-1">
        <div className="rounded-2xl bg-white p-8 text-center">
          <h1 className="text-xl font-bold text-foreground">{title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{description}</p>
          <p className="mt-4 text-xs text-muted-foreground">
            곧 콘텐츠가 추가됩니다.
          </p>
        </div>
      </div>
    </div>
  );
}
