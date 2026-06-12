import Image from "next/image";
import Link from "next/link";

/** 호케이 SVG 마크 + 워드마크 */
export function SiteLogo({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="flex shrink-0 items-center gap-1.5">
      <Image
        src="/icons/hokei-mark.svg"
        alt=""
        width={28}
        height={28}
        className="h-7 w-7 shrink-0"
        priority
      />
      <span className="flex flex-col leading-none">
        <span
          className={`font-black tracking-tight text-[#c8102e] ${compact ? "text-[13px]" : "text-sm"}`}
        >
          HOKEI
        </span>
        {!compact && (
          <span className="mt-0.5 text-[9px] font-medium tracking-wide text-muted-foreground">
            호치민 한인 포털
          </span>
        )}
      </span>
    </Link>
  );
}
