import { redirect } from "next/navigation";

/** 통합 뉴스 (type=all) → /news 아카이브 */
export default async function BoardNewsAllPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { type } = await searchParams;
  if (type === "all" || !type) {
    redirect("/news");
  }
  redirect("/news");
}
