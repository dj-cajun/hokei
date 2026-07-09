import Link from "next/link";
import { notFound } from "next/navigation";
import { Download, ExternalLink } from "lucide-react";
import { AdSenseUnit } from "@/components/ads/adsense-unit";
import { Sidebar } from "@/components/layout/sidebar";
import { LifeAudioButton } from "@/components/life/life-audio-button";
import { AdminLifeGuideDeleteButton } from "@/components/life/admin-life-guide-delete-button";
import { LifeShowModeToggle } from "@/components/life/life-show-mode";
import { LifeSourceNotice } from "@/components/life/life-source-notice";
import { LifeGuideImageGrid } from "@/components/life/life-guide-image-grid";
import { normalizeLifeGuideImageUrls } from "@/lib/life/guide-images";
import { isDatabaseAvailable } from "@/lib/database-available";
import { getLifeGuideBySlug } from "@/lib/life/guides";
import { LIFE_DOMAIN_LABELS, LIFE_KIND_LABELS } from "@/lib/life/labels";
import { resolveSiteUrl } from "@/lib/site-url";
import { cn } from "@/lib/utils";

function lifeGuideDescription(body: string) {
  return body
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 160);
}

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  if (!isDatabaseAvailable()) return { title: "생활 가이드 - 호케이" };
  const guide = await getLifeGuideBySlug(slug);
  if (!guide) return { title: "생활 가이드 - 호케이" };
  const description = lifeGuideDescription(guide.body);
  const siteUrl = resolveSiteUrl();
  const canonical = `${siteUrl}/life/${guide.slug}`;
  const images = normalizeLifeGuideImageUrls(guide);
  const ogImage = images[0] ?? `${siteUrl}/icons/hokei-icon-512.png`;
  return {
    title: `${guide.title} - 호케이`,
    description,
    alternates: { canonical },
    openGraph: {
      title: guide.title,
      description,
      url: canonical,
      type: "article",
      locale: "ko_KR",
      siteName: "호케이 Hokei",
      images: [{ url: ogImage, alt: guide.title }],
    },
    twitter: {
      card: images.length > 0 ? "summary_large_image" : "summary",
      title: guide.title,
      description,
      images: [ogImage],
    },
  };
}

export default async function LifeDetailPage({ params }: PageProps) {
  const { slug } = await params;
  if (!isDatabaseAvailable()) notFound();

  const guide = await getLifeGuideBySlug(slug);
  if (!guide) notFound();

  const isPhrase = guide.kind === "PHRASE";
  const isStudy = guide.domain === "STUDY";
  const listHref = isStudy ? "/life/study" : "/life";
  const listLabel = isStudy ? "베트남어 공부 목록" : "생활 가이드 목록";

  return (
    <div className="mx-auto flex w-full max-w-[480px] flex-1 flex-col lg:max-w-6xl lg:flex-row lg:gap-6 lg:px-4 lg:py-6">
      <Sidebar />
      <div className="min-w-0 flex-1 bg-surface lg:rounded-lg">
        <article className="px-3 py-4 lg:p-8">
          <p className="text-[11px] text-muted-foreground">
            {LIFE_KIND_LABELS[guide.kind]} · {LIFE_DOMAIN_LABELS[guide.domain]}
          </p>
          <h1 className="mt-2 text-lg font-bold">{guide.title}</h1>

          {isStudy && (
            <div className="mt-3">
              <AdminLifeGuideDeleteButton
                guideId={guide.id}
                title={guide.title}
                redirectHref="/life/study"
              />
            </div>
          )}

          <LifeSourceNotice isCrawl={guide.isCrawl} domainStudy={isStudy} />

          {guide.sourceLabel && (
            <p className="mt-2 rounded-lg bg-secondary/60 px-2.5 py-1.5 text-[11px] text-muted-foreground">
              출처: {guide.sourceLabel}
            </p>
          )}

          {normalizeLifeGuideImageUrls(guide).length > 0 && (
            <LifeGuideImageGrid urls={normalizeLifeGuideImageUrls(guide)} />
          )}

          {isPhrase && guide.vnText && (
            <LifeShowModeToggle vnText={guide.vnText} title={guide.title}>
              <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 px-4 py-4">
                <p
                  className={cn(
                    guide.vnText.length > 72
                      ? "text-lg font-bold leading-snug text-primary sm:text-xl"
                      : "text-2xl font-bold leading-snug text-primary"
                  )}
                >
                  {guide.vnText}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <LifeAudioButton audioUrl={guide.audioUrl} />
                </div>
              </div>
            </LifeShowModeToggle>
          )}

          {!isPhrase && guide.fileUrl && (
            <Link
              href={guide.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white"
            >
              <Download className="h-4 w-4" />
              오피셜 양식·자료 열기
            </Link>
          )}

          <div className="mt-4 whitespace-pre-wrap text-sm leading-relaxed">
            {guide.body}
          </div>

          {guide.externalUrl && (
            <Link
              href={guide.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-1 text-sm text-primary hover:underline"
            >
              <ExternalLink className="h-4 w-4" />
              원문 사이트
            </Link>
          )}

          {isStudy && !guide.isCrawl && (
            <p className="mt-6 text-center text-[11px] text-muted-foreground">
              댓글·피드백 기능은 곧 연결됩니다.
            </p>
          )}

          <AdSenseUnit slotKind="article" className="mt-6" />
        </article>
        <div className="border-t border-border-light px-3 py-3 text-center">
          <Link href={listHref} className="text-xs text-primary hover:underline">
            {listLabel}
          </Link>
        </div>
      </div>
    </div>
  );
}
