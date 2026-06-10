import { notFound, redirect } from "next/navigation";
import { getNewsBoardRedirect } from "@/lib/news-boards-config";

/** 구 뉴스 보드 URL → `/news/*` 하위 카테고리로 영구 리다이렉트 */
export default async function NewsBoardRedirectPage({
  params,
}: {
  params: Promise<{ boardSlug: string }>;
}) {
  const { boardSlug } = await params;
  const target = getNewsBoardRedirect(boardSlug);
  if (!target) notFound();
  redirect(target);
}
