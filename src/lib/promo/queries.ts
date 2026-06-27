import { visiblePostWhere } from "@/lib/moderation";
import { HERE_HOW_LEAF_SLUGS, HERE_HOW_MID_SLUG } from "@/lib/here-how";
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
  category: {
    OR: [
      { parent: { slug: HERE_HOW_MID_SLUG } },
      { parent: { slug: "promo" } },
      { slug: { in: [...HERE_HOW_LEAF_SLUGS] } },
    ],
  },
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
  limit = 50,
  storeName?: string | null
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

  const normalizedName = storeName?.trim().toLowerCase();

  const filtered = posts.filter((p) => {
    if (!p.storeName) return false;
    if (slugifyStoreName(p.storeName) === storeSlug) return true;
    if (normalizedName && p.storeName.trim().toLowerCase() === normalizedName) {
      return true;
    }
    return false;
  });

  const resolvedStoreName = filtered[0]?.storeName ?? null;

  return {
    storeName: resolvedStoreName,
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
