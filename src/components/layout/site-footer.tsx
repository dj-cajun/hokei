import Link from "next/link";
import { Mail } from "lucide-react";

const legalLinks = [
  { href: "/terms", label: "이용약관" },
  { href: "/privacy", label: "개인정보처리방침" },
  { href: "/contact", label: "문의하기" },
  { href: "?view=desktop", label: "PC버전" },
];

const sitemapLinks = [
  { href: "/news", label: "뉴스" },
  { href: "/community", label: "커뮤니티" },
  { href: "/real-estate", label: "부동산" },
  { href: "/classifieds", label: "벼룩시장" },
  { href: "/jobs", label: "구인·구직" },
  { href: "/search", label: "검색" },
];

const AD_EMAIL = "ads@hokei.vn";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-[#0b132b] px-4 py-8 text-[11px] text-gray-400 dark:bg-[#0b132b]">
      <div className="mx-auto grid max-w-6xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <p className="text-xs font-bold text-gray-200">호케이 Hokei</p>
          <p className="mt-2 leading-relaxed">
            호치민·베트남 거주 한국 교민을 위한 뉴스·커뮤니티·생활 정보 포털
          </p>
          <a
            href={`mailto:${AD_EMAIL}`}
            className="mt-3 inline-flex items-center gap-1.5 text-primary hover:underline"
          >
            <Mail className="h-3.5 w-3.5" aria-hidden />
            광고·제휴 문의: {AD_EMAIL}
          </a>
        </div>

        <div>
          <p className="text-xs font-bold text-gray-200">바로가기</p>
          <ul className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5">
            {sitemapLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="hover:text-gray-200">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-xs font-bold text-gray-200">정책</p>
          <ul className="mt-2 space-y-1.5">
            {legalLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="hover:text-gray-200">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <p className="mx-auto mt-8 max-w-6xl border-t border-white/10 pt-4 text-center leading-relaxed">
        © {new Date().getFullYear()} 호케이 Hokei · Ho Chi Minh Korean Community
      </p>
    </footer>
  );
}
