import { resolveSiteUrl } from "@/lib/site-url";

const SITE_ICON = {
  png512: "/icons/hokei-icon-512.png",
  png192: "/icons/hokei-icon-192.png",
  svg: "/icons/hokei-icon.svg",
} as const;

function siteLogoImageObject(siteUrl: string) {
  return {
    "@type": "ImageObject" as const,
    url: `${siteUrl}${SITE_ICON.png512}`,
    contentUrl: `${siteUrl}${SITE_ICON.png512}`,
    width: 512,
    height: 512,
  };
}

/** 홈·레이아웃 WebSite 구조화 데이터 */
export function SiteJsonLd() {
  const siteUrl = resolveSiteUrl();

  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        name: "호케이 Hokei",
        url: siteUrl,
        logo: siteLogoImageObject(siteUrl),
        image: [
          `${siteUrl}${SITE_ICON.png512}`,
          `${siteUrl}${SITE_ICON.png192}`,
          `${siteUrl}${SITE_ICON.svg}`,
        ],
      },
      {
        "@type": "WebSite",
        name: "호케이 Hokei",
        url: siteUrl,
        description:
          "호치민 거주 한국 교민을 위한 현지 뉴스, 숙소, 구인, 생존 Q&A, 커뮤니티.",
        inLanguage: "ko-KR",
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
