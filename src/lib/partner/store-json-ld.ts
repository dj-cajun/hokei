import type { PartnerStore } from "@/generated/prisma/client";
import { resolveSiteUrl } from "@/lib/site-url";

type StoreJsonLdInput = Pick<
  PartnerStore,
  "slug" | "name" | "tagline" | "introText" | "phone" | "address" | "thumbnail"
>;

export function buildLocalBusinessJsonLd(store: StoreJsonLdInput) {
  const siteUrl = resolveSiteUrl();
  const url = `${siteUrl}/store/${store.slug}`;
  const description =
    store.introText?.trim() || store.tagline?.trim() || undefined;

  const image = store.thumbnail?.trim();
  const imageUrl = image
    ? image.startsWith("http")
      ? image
      : `${siteUrl}${image.startsWith("/") ? image : `/${image}`}`
    : undefined;

  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: store.name,
    url,
  };

  if (description) data.description = description;
  if (store.phone?.trim()) data.telephone = store.phone.trim();
  if (imageUrl) data.image = imageUrl;
  if (store.address?.trim()) {
    data.address = {
      "@type": "PostalAddress",
      streetAddress: store.address.trim(),
      addressCountry: "VN",
    };
  }

  return data;
}
