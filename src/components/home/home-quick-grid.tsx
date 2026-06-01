import Link from "next/link";

const PASTELS = [
  "bg-amber-100",
  "bg-green-100",
  "bg-sky-100",
  "bg-rose-100",
  "bg-violet-100",
  "bg-teal-100",
] as const;

const items = [
  { href: "/news", label: "뉴스", emoji: "📰" },
  { href: "/real-estate", label: "부동산", emoji: "🏠" },
  { href: "/jobs", label: "구인구직", emoji: "💼" },
  { href: "/classifieds", label: "중고거래", emoji: "♻️" },
  { href: "/community", label: "커뮤니티", emoji: "💬" },
  { href: "/news", label: "생활정보", emoji: "🌏" },
] as const;

export function HomeQuickGrid() {
  return (
    <section
      className="grid grid-cols-3 gap-x-4 gap-y-3 bg-white p-4"
      aria-label="퀵 메뉴"
    >
      {items.map((item, i) => (
        <Link
          key={item.label}
          href={item.href}
          className="flex flex-col items-center gap-1.5 active:opacity-80"
        >
          <span
            className={`flex h-14 w-14 items-center justify-center rounded-full text-xl ${PASTELS[i % PASTELS.length]}`}
          >
            {item.emoji}
          </span>
          <span className="text-center text-[11px] font-medium text-gray-700">
            {item.label}
          </span>
        </Link>
      ))}
    </section>
  );
}
