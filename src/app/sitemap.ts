import type { MetadataRoute } from "next";
import { isDatabaseAvailable } from "@/lib/database-available";
import { prisma } from "@/lib/prisma";

function siteUrl(): string {
  const url = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (url) return url.replace(/\/$/, "");
  return "http://localhost:3001";
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    "",
    "/news",
    "/community",
    "/jobs",
    "/real-estate",
    "/classifieds",
    "/search",
  ].map((path) => ({
    url: `${base}${path}`,
    lastModified: now,
    changeFrequency: path === "" ? "hourly" : "daily",
    priority: path === "" ? 1 : 0.8,
  }));

  let posts: { id: string; publishedAt: Date }[] = [];
  if (!isDatabaseAvailable()) {
    return staticRoutes;
  }
  try {
    posts = await prisma.post.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { publishedAt: "desc" },
      take: 500,
      select: { id: true, publishedAt: true },
    });
  } catch {
    /* build/CI without DB */
  }

  const postRoutes: MetadataRoute.Sitemap = posts.map((p) => ({
    url: `${base}/posts/${p.id}`,
    lastModified: p.publishedAt,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  return [...staticRoutes, ...postRoutes];
}
