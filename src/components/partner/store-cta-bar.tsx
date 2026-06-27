import { MapPin, MessageCircle, Phone } from "lucide-react";
import { isValidKakaoLink } from "@/lib/kakao-link";
import { isValidMapsUrl, isValidPartnerPhone } from "@/lib/partner/validate";
import { cn } from "@/lib/utils";

type StoreCtaBarProps = {
  kakaoLink?: string | null;
  phone?: string | null;
  mapsUrl?: string | null;
  className?: string;
};

function toTelHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

export function StoreCtaBar({
  kakaoLink,
  phone,
  mapsUrl,
  className,
}: StoreCtaBarProps) {
  const kakao =
    kakaoLink && isValidKakaoLink(kakaoLink) ? kakaoLink.trim() : null;
  const tel =
    phone && isValidPartnerPhone(phone) ? toTelHref(phone.trim()) : null;
  const maps =
    mapsUrl && isValidMapsUrl(mapsUrl) ? mapsUrl.trim() : null;

  if (!kakao && !tel && !maps) return null;

  const buttonClass =
    "flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-lg px-3 text-sm font-semibold transition-opacity hover:opacity-90";

  return (
    <div
      className={cn(
        "sticky bottom-12 z-40 border-y border-border-light bg-surface/95 px-3 py-2 backdrop-blur-md supports-[backdrop-filter]:bg-surface/90 lg:bottom-0",
        className
      )}
    >
      <div className="flex gap-2">
        {kakao && (
          <a
            href={kakao}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(buttonClass, "bg-[#FEE500] text-[#191919]")}
          >
            <MessageCircle className="h-4 w-4 shrink-0" aria-hidden />
            카톡
          </a>
        )}
        {tel && (
          <a href={tel} className={cn(buttonClass, "bg-primary text-primary-foreground")}>
            <Phone className="h-4 w-4 shrink-0" aria-hidden />
            전화
          </a>
        )}
        {maps && (
          <a
            href={maps}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              buttonClass,
              "border border-border bg-card text-foreground"
            )}
          >
            <MapPin className="h-4 w-4 shrink-0" aria-hidden />
            길찾기
          </a>
        )}
      </div>
    </div>
  );
}
