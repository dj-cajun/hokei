import Link from "next/link";

const links = [
  { href: "/terms", label: "이용약관" },
  { href: "/privacy", label: "개인정보처리방침" },
  { href: "?view=desktop", label: "PC버전 보기" },
  { href: "/contact", label: "문의하기" },
];

export function SiteFooter() {
  return (
    <footer className="bg-[#0b132b] p-6 text-[11px] text-muted-foreground">
      <nav className="flex flex-wrap items-center justify-center gap-x-1 gap-y-1">
        {links.map((link, i) => (
          <span key={link.href} className="inline-flex items-center">
            {i > 0 && <span className="mx-1.5 text-muted-foreground">|</span>}
            <Link href={link.href} className="hover:text-gray-200">
              {link.label}
            </Link>
          </span>
        ))}
      </nav>
      <p className="mt-3 text-center leading-relaxed text-muted-foreground">
        © {new Date().getFullYear()} 호케이 Hokei · Ho Chi Minh Korean Community
      </p>
    </footer>
  );
}
