import { resolveSiteUrl } from "@/lib/site-url";

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
        logo: `${siteUrl}/icons/hokei-icon-512.png`,
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
