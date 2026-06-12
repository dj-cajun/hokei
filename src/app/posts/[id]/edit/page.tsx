import { notFound, redirect } from "next/navigation";
import { WriteForm } from "@/components/write/write-form";
import { auth } from "@/auth";
import { getWritableCategories } from "@/lib/categories";
import { isCommunityPost } from "@/lib/community";
import { isPostOwner } from "@/lib/post-permissions";
import { getPostById } from "@/lib/posts";

export const metadata = {
  title: "글 수정 - 호케이",
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditPostPage({ params }: PageProps) {
  const { id } = await params;
  const [post, categories, session] = await Promise.all([
    getPostById(id),
    getWritableCategories(),
    auth(),
  ]);

  if (!post || !isCommunityPost(post.sourceUrl)) notFound();

  const canEditAsUser = isPostOwner(post, session?.user?.id);
  const isGuestPost = !post.authorId && Boolean(post.guestPasswordHash);

  if (!canEditAsUser && !isGuestPost && session?.user?.role !== "ADMIN") {
    redirect(`/posts/${id}`);
  }

  return (
    <div className="mx-auto min-h-[100dvh] w-full max-w-[480px] bg-surface">
      <WriteForm
        mode="edit"
        postId={id}
        pageTitle="글 수정"
        categories={categories}
        initial={{
          categoryId: post.categoryId,
          title: post.title,
          body: post.content ?? "",
          attachments: post.attachments.map((a) => ({
            url: a.url,
            fileName: a.fileName,
            mimeType: a.mimeType,
            size: a.size,
            kind: a.kind,
          })),
        }}
      />
    </div>
  );
}
