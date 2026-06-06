import { resolveSiteUrl } from "@/lib/site-url";

type ArticleJsonLdProps = {
  id: string;
  title: string;
  description: string;
  publishedAt: Date;
  thumbnail?: string | null;
  authorName?: string | null;
};

export function ArticleJsonLd({
  id,
  title,
  description,
  publishedAt,
  thumbnail,
  authorName,
}: ArticleJsonLdProps) {
  const siteUrl = resolveSiteUrl();
  const url = `${siteUrl}/posts/${id}`;

  const data = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description,
    url,
    datePublished: publishedAt.toISOString(),
    image: thumbnail ? [thumbnail] : [`${siteUrl}/icons/hokei-icon-512.png`],
    author: authorName
      ? { "@type": "Person", name: authorName }
      : { "@type": "Organization", name: "호케이 Hokei" },
    publisher: {
      "@type": "Organization",
      name: "호케이 Hokei",
      logo: {
        "@type": "ImageObject",
        url: `${siteUrl}/icons/hokei-icon-512.png`,
      },
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
