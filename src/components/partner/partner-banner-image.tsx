import Image from "next/image";
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
  return (
    <Image
      src={src}
      alt={alt}
      fill
      priority={priority}
      sizes={sizes}
      unoptimized={src.endsWith(".svg")}
      className={cn(
        fit === "contain"
          ? "object-contain object-center"
          : "object-cover object-center",
        className
      )}
    />
  );
}
