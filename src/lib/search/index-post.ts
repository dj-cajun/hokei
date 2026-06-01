import { getDatabaseKind } from "@/lib/prisma";
import { indexPostInFts, removePostFromFts } from "@/lib/search/post-fts";
import { indexPostInPgFts, removePostFromPgFts } from "@/lib/search/post-pg-fts";

export type PostSearchDoc = {
  id: string;
  title: string;
  summary: string;
  content: string | null;
  status: string;
};

export async function indexPostInSearch(post: PostSearchDoc): Promise<void> {
  if (getDatabaseKind() === "sqlite") {
    await indexPostInFts(post);
    return;
  }
  await indexPostInPgFts(post);
}

export async function removePostFromSearch(postId: string): Promise<void> {
  if (getDatabaseKind() === "sqlite") {
    await removePostFromFts(postId);
    return;
  }
  await removePostFromPgFts(postId);
}

export async function reindexAllSearch(): Promise<{ indexed: number }> {
  if (getDatabaseKind() === "sqlite") {
    const { reindexAllPostsFts } = await import("@/lib/search/post-fts");
    return reindexAllPostsFts();
  }
  const { reindexAllPostsPgFts } = await import("@/lib/search/post-pg-fts");
  const indexed = await reindexAllPostsPgFts();
  return { indexed };
}
