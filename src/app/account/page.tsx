import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireAuth } from "@/lib/auth-utils";
import { getUserManageablePosts } from "@/lib/profile";
import { MyPostsPanel } from "@/components/account/my-posts-panel";

export const metadata: Metadata = {
  title: "회원 관리 - 호케이 Hokei",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const session = await requireAuth();
  const posts = await getUserManageablePosts(session.user.id);

  const serialized = posts.map((p) => ({
    id: p.id,
    title: p.title,
    status: p.status,
    moderationStatus: p.moderationStatus,
    publishedAt: p.publishedAt.toISOString(),
    categoryLabel: p.category.label,
    categoryHref: p.category.href,
  }));

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">
      <Link
        href="/"
        className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        홈으로
      </Link>

      <div className="rounded-2xl bg-surface p-6 md:p-8">
        <h1 className="text-xl font-bold">회원 관리</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {session.user.name}님 · 내가 작성한 글 {serialized.length}건
        </p>

        <MyPostsPanel posts={serialized} />
      </div>
    </div>
  );
}
