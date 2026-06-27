import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { StoreLanding } from "@/components/partner/store-landing";
import { isDatabaseAvailable } from "@/lib/database-available";
import { getPartnerStoreBySlug } from "@/lib/partner/queries";
import { resolveSiteUrl } from "@/lib/site-url";

export const revalidate = 60;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  if (!isDatabaseAvailable()) {
    return { title: "제휴 업소 - 호케이" };
  }

  const store = await getPartnerStoreBySlug(slug);
  if (!store) {
    return { title: "업소를 찾을 수 없음 - 호케이" };
  }

  const description =
    store.tagline?.trim() ||
    store.description?.replace(/\s+/g, " ").trim().slice(0, 160) ||
    `${store.name} - 호케이 제휴 업소`;
  const canonical = `${resolveSiteUrl()}/store/${store.slug}`;
  const ogImage = store.thumbnail?.trim() || undefined;

  return {
    title: `${store.name} | 호케이`,
    description,
    alternates: { canonical },
    openGraph: {
      title: store.name,
      description,
      url: canonical,
      type: "website",
      ...(ogImage ? { images: [{ url: ogImage }] } : {}),
    },
  };
}

export default async function PartnerStorePage({ params }: PageProps) {
  const { slug } = await params;
  if (!isDatabaseAvailable()) {
    notFound();
  }

  const store = await getPartnerStoreBySlug(slug);
  if (!store) {
    notFound();
  }

  return (
    <div className="mx-auto flex w-full max-w-[480px] flex-1 flex-col lg:max-w-6xl lg:flex-row lg:gap-6 lg:px-4 lg:py-6">
      <Sidebar />
      <StoreLanding store={store} />
    </div>
  );
}
