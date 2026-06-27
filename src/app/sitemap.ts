import type { MetadataRoute } from "next";
import { isDatabaseAvailable } from "@/lib/database-available";
import { prisma } from "@/lib/prisma";
import { publishedPartnerWhere } from "@/lib/partner/queries";
import { resolveSiteUrl } from "@/lib/site-url";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = resolveSiteUrl();
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    "",
    "/news",
    "/community",
    "/jobs",
    "/real-estate",
    "/classifieds",
    "/promo",
    "/partners",
    "/life",
    "/life/study",
    "/search",
    "/privacy",
    "/terms",
    "/contact",
  ].map((path) => ({
    url: `${base}${path}`,
    lastModified: now,
    changeFrequency: path === "" ? "hourly" : "daily",
    priority: path === "" ? 1 : 0.8,
  }));

  let posts: { id: string; publishedAt: Date }[] = [];
  let partnerStores: { slug: string; updatedAt: Date }[] = [];
  if (!isDatabaseAvailable()) {
    return staticRoutes;
  }
  try {
    [posts, partnerStores] = await Promise.all([
      prisma.post.findMany({
        where: { status: "PUBLISHED" },
        orderBy: { publishedAt: "desc" },
        take: 500,
        select: { id: true, publishedAt: true },
      }),
      prisma.partnerStore.findMany({
        where: publishedPartnerWhere(),
        select: { slug: true, updatedAt: true },
        orderBy: { updatedAt: "desc" },
        take: 200,
      }),
    ]);
  } catch {
    /* build/CI without DB */
  }

  const postRoutes: MetadataRoute.Sitemap = posts.map((p) => ({
    url: `${base}/posts/${p.id}`,
    lastModified: p.publishedAt,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  const storeRoutes: MetadataRoute.Sitemap = partnerStores.map((s) => ({
    url: `${base}/store/${s.slug}`,
    lastModified: s.updatedAt,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [...staticRoutes, ...postRoutes, ...storeRoutes];
}
