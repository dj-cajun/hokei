import Link from "next/link";

/** 보스턴코리아형 — 레드 심볼 + 워드마크 */
export function SiteLogo({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="flex shrink-0 items-center gap-1.5">
      <span
        className="flex h-7 w-7 items-center justify-center rounded-md bg-[#c8102e] text-[10px] font-black leading-none text-white shadow-sm"
        aria-hidden
      >
        H
      </span>
      <span className="flex flex-col leading-none">
        <span
          className={`font-black tracking-tight text-[#c8102e] ${compact ? "text-[13px]" : "text-sm"}`}
        >
          HOKEI
        </span>
        {!compact && (
          <span className="mt-0.5 text-[9px] font-medium tracking-wide text-gray-500">
            호치민 한인 포털
          </span>
        )}
      </span>
    </Link>
  );
}
