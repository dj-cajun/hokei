import { CurateNewsPanel } from "@/components/admin/curate-news-panel";
import { prisma } from "@/lib/prisma";

export default async function AdminCuratePage() {
  const categories = await prisma.category.findMany({
    where: { parent: { slug: "news" } },
    orderBy: { sortOrder: "asc" },
    select: { id: true, label: true, slug: true },
  });

  if (categories.length === 0) {
    return (
      <div className="rounded-2xl bg-surface p-6 text-sm text-muted-foreground">
        뉴스 카테고리가 없습니다. npm run db:seed:categories 를 실행하세요.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">콘텐츠 재가공</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          총영사관·한인회 공지는 원문 <strong>본문을 복사</strong>해 올리고, 상세
          페이지에 <strong>원문 바로가기</strong>를 함께 표시합니다. 출처 URL은
          필수입니다.
        </p>
      </div>
      <CurateNewsPanel
        categories={categories}
        defaultCategoryId={
          categories.find((c) => c.slug === "news-consulate-association")?.id ??
          categories[0]!.id
        }
      />
    </div>
  );
}
