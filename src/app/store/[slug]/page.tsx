import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StoreLanding } from "@/components/partner/store-landing";
import { isDatabaseAvailable } from "@/lib/database-available";
import { getPartnerStoreBySlug } from "@/lib/partner/queries";
import { resolveSiteUrl } from "@/lib/site-url";

export const revalidate = 60;

interface PageProps {
  params: Promise<{ slug: string }>;
}

function buildStoreCanonical(slug: string): string {
  return `${resolveSiteUrl()}/store/${slug}`;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;

  if (!isDatabaseAvailable()) {
    return { title: "제휴 업소 | 호케이" };
  }

  const store = await getPartnerStoreBySlug(slug);
  if (!store) {
    return { title: "제휴 업소 | 호케이" };
  }

  const title = `${store.name} | 호케이`;
  const description =
    store.tagline?.trim() ||
    store.description?.trim()?.replace(/\s+/g, " ").slice(0, 160) ||
    `${store.name} — 호케이 제휴 업소`;
  const canonical = buildStoreCanonical(store.slug);
  const ogImage = store.thumbnail?.trim() || "/icons/hokei-icon-512.png";

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      locale: "ko_KR",
      type: "website",
      images: [{ url: ogImage, alt: store.name }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

export default async function PartnerStorePage({ params }: PageProps) {
  const { slug } = await params;

  if (!isDatabaseAvailable()) notFound();

  const store = await getPartnerStoreBySlug(slug);
  if (!store) notFound();

  return (
    <div className="mx-auto w-full max-w-[480px] flex-1">
      <StoreLanding store={store} />
    </div>
  );
}
