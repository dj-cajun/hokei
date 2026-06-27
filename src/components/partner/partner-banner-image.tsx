import Image from "next/image";
import { normalizePartnerBannerImageSrc } from "@/lib/partner/banner-image-src";
import { cn } from "@/lib/utils";

type PartnerBannerImageProps = {
  src: string;
  alt: string;
  priority?: boolean;
  fit?: "cover" | "contain";
  sizes?: string;
  className?: string;
};

/** 제휴 배너 — fill + object-fit (로컬 /public·Blob URL) */
export function PartnerBannerImage({
  src,
  alt,
  priority = false,
  fit = "cover",
  sizes = "100vw",
  className,
}: PartnerBannerImageProps) {
  const normalized = normalizePartnerBannerImageSrc(src);
  return (
    <Image
      src={normalized}
      alt={alt}
      fill
      priority={priority}
      sizes={sizes}
      unoptimized={normalized.endsWith(".svg")}
      className={cn(
        fit === "contain"
          ? "object-contain object-center"
          : "object-cover object-center",
        className
      )}
    />
  );
}
