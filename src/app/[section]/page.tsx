import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SectionPage } from "@/components/category/section-page";
import { getSectionBySlug, getSectionSlugs } from "@/lib/categories";

interface PageProps {
  params: Promise<{ section: string }>;
}

export async function generateStaticParams() {
  const slugs = await getSectionSlugs();
  return slugs;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { section: sectionSlug } = await params;
  const section = await getSectionBySlug(sectionSlug);
  if (!section) return { title: "호케이 Hokei" };
  return {
    title: `${section.label} - 호케이 Hokei`,
    description: section.description ?? undefined,
    openGraph: {
      title: `${section.label} - 호케이 Hokei`,
      description: section.description ?? section.label,
      locale: "ko_KR",
      type: "website",
    },
  };
}

export default async function SectionRoutePage({ params }: PageProps) {
  const { section: sectionSlug } = await params;
  const section = await getSectionBySlug(sectionSlug);

  if (!section) notFound();

  return (
    <SectionPage
      sectionSlug={section.slug}
      label={section.label}
      colorClass={section.colorClass}
      href={section.href}
      subcategories={section.children}
    />
  );
}
