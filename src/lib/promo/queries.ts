import { visiblePostWhere } from "@/lib/moderation";
import { slugifyStoreName } from "@/lib/admin/publish-curated-trade";
import { prisma } from "@/lib/prisma";

export type PromoStoreSummary = {
  storeName: string;
  slug: string;
  postCount: number;
  latestTitle: string;
  latestAt: Date;
  thumbnail: string | null;
};

const promoPostWhere = {
  ...visiblePostWhere,
  category: { parent: { slug: "promo" } },
};

export async function getPromoStores(limit = 24): Promise<PromoStoreSummary[]> {
  const posts = await prisma.post.findMany({
    where: {
      ...promoPostWhere,
      storeName: { not: null },
    },
    orderBy: { publishedAt: "desc" },
    take: 200,
    select: {
      storeName: true,
      title: true,
      publishedAt: true,
      thumbnail: true,
    },
  });

  const map = new Map<string, PromoStoreSummary>();
  for (const post of posts) {
    const name = post.storeName?.trim();
    if (!name) continue;
    const existing = map.get(name);
    if (!existing) {
      map.set(name, {
        storeName: name,
        slug: slugifyStoreName(name),
        postCount: 1,
        latestTitle: post.title,
        latestAt: post.publishedAt,
        thumbnail: post.thumbnail,
      });
    } else {
      existing.postCount += 1;
    }
  }

  return [...map.values()]
    .sort((a, b) => b.latestAt.getTime() - a.latestAt.getTime())
    .slice(0, limit);
}

export async function getPromoPostsByStore(
  storeSlug: string,
  limit = 50
): Promise<{
  storeName: string | null;
  items: {
    id: string;
    title: string;
    summary: string;
    publishedAt: Date;
    thumbnail: string | null;
    isCrawl: boolean;
    kakaoLink: string | null;
  }[];
}> {
  const posts = await prisma.post.findMany({
    where: promoPostWhere,
    orderBy: { publishedAt: "desc" },
    take: 300,
    select: {
      id: true,
      title: true,
      summary: true,
      publishedAt: true,
      thumbnail: true,
      storeName: true,
      isCrawl: true,
      kakaoLink: true,
    },
  });

  const filtered = posts.filter(
    (p) => p.storeName && slugifyStoreName(p.storeName) === storeSlug
  );

  const storeName = filtered[0]?.storeName ?? null;

  return {
    storeName,
    items: filtered.slice(0, limit),
  };
}

export async function getRecentPromoPosts(limit = 20) {
  return prisma.post.findMany({
    where: promoPostWhere,
    orderBy: { publishedAt: "desc" },
    take: limit,
    select: {
      id: true,
      title: true,
      summary: true,
      publishedAt: true,
      thumbnail: true,
      storeName: true,
      isCrawl: true,
    },
  });
}
