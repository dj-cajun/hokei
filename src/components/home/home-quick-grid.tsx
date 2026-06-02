"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Newspaper } from "lucide-react";

const PASTELS = [
  "bg-amber-100",
  "bg-green-100",
  "bg-sky-100",
  "bg-rose-100",
  "bg-violet-100",
  "bg-teal-100",
] as const;

const linkItems = [
  { href: "/real-estate", label: "부동산", emoji: "🏠" },
  { href: "/jobs", label: "구인구직", emoji: "💼" },
  { href: "/classifieds", label: "중고거래", emoji: "♻️" },
  { href: "/community", label: "커뮤니티", emoji: "💬" },
  { href: "/community/survival-qa", label: "생활정보", emoji: "🌏" },
] as const;

export function HomeQuickGrid() {
  const router = useRouter();

  return (
    <section
      className="border-b border-gray-100 bg-white px-4 py-6"
      aria-label="퀵 메뉴"
    >
      <div className="mx-auto grid max-w-md grid-cols-3 gap-x-4 gap-y-3 text-center">
        <button
          type="button"
          className="group flex flex-col items-center gap-1.5 focus:outline-none focus:ring-0"
          onClick={() => router.push("/board/news?type=all")}
        >
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-blue-500 transition-transform group-active:scale-95">
            <Newspaper className="h-6 w-6" strokeWidth={2} aria-hidden />
          </span>
          <span className="text-[11px] font-medium text-gray-700">전체뉴스</span>
        </button>

        {linkItems.map((item, i) => (
          <Link
            key={item.label}
            href={item.href}
            className="group flex flex-col items-center gap-1.5 focus:outline-none focus:ring-0"
          >
            <span
              className={`flex h-14 w-14 items-center justify-center rounded-full text-xl transition-transform group-active:scale-95 ${PASTELS[(i + 1) % PASTELS.length]}`}
            >
              {item.emoji}
            </span>
            <span className="text-[11px] font-medium text-gray-700">
              {item.label}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
