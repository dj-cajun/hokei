import { buildLocalBusinessJsonLd } from "@/lib/partner/store-json-ld";
import type { PartnerStore } from "@/generated/prisma/client";

type LocalBusinessJsonLdProps = {
  store: Pick<
    PartnerStore,
    "slug" | "name" | "tagline" | "introText" | "phone" | "address" | "thumbnail"
  >;
};

export function LocalBusinessJsonLd({ store }: LocalBusinessJsonLdProps) {
  const data = buildLocalBusinessJsonLd(store);

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
