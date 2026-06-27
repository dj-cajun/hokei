import Link from "next/link";
import { LIFE_INFO_HUB_HREF } from "@/lib/life-info-hub";
import { getAdContactEmail } from "@/lib/contact-emails";
import { AdInquiryLink } from "@/components/contact/ad-inquiry-link";

const quickLinks = [
  { href: "/news", label: "뉴스" },
  { href: "/community", label: "커뮤니티" },
  { href: "/life", label: "생활 가이드" },
  { href: LIFE_INFO_HUB_HREF, label: "한인 업소" },
  { href: "/real-estate", label: "부동산" },
  { href: "/classifieds", label: "중고 거래" },
  { href: "/jobs", label: "구인·구직" },
  { href: "/search", label: "검색" },
] as const;

const policyLinks = [
  { href: "/terms", label: "이용약관" },
  { href: "/privacy", label: "개인정보처리방침" },
  { href: "/contact", label: "문의하기" },
] as const;

function FooterLink({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-8 items-center rounded-md px-0.5 text-[12px] text-gray-400 transition-colors hover:text-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
    >
      {label}
    </Link>
  );
}

export function SiteFooter() {
  const year = new Date().getFullYear();
  const adEmail = getAdContactEmail();

  return (
    <footer className="mt-auto border-t border-border bg-[#0b132b] text-gray-400">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-12">
          <div>
            <p className="text-sm font-bold tracking-tight text-gray-100">
              호케이 <span className="font-medium text-gray-400">Hokei</span>
            </p>
            <p className="mt-2 max-w-sm text-[12px] leading-relaxed text-gray-400">
              호치민·베트남 거주 한국 교민을 위한 뉴스·커뮤니티·생활 정보 포털
            </p>
            <AdInquiryLink
              email={adEmail}
              className="mt-4 inline-flex items-center gap-1.5 text-[12px] text-primary transition-colors hover:text-primary/80"
            />
          </div>

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
              바로가기
            </p>
            <ul className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1 sm:grid-cols-2">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <FooterLink href={link.href} label={link.label} />
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-white/10 pt-6">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
            정책
          </p>
          <nav
            className="mt-3 flex flex-wrap items-center gap-x-1 gap-y-2"
            aria-label="정책 및 문의"
          >
            {policyLinks.map((link, index) => (
              <span key={link.href} className="inline-flex items-center gap-1">
                {index > 0 ? (
                  <span className="select-none px-1 text-gray-600" aria-hidden>
                    ·
                  </span>
                ) : null}
                <FooterLink href={link.href} label={link.label} />
              </span>
            ))}
            <span className="select-none px-1 text-gray-600" aria-hidden>
              ·
            </span>
            <FooterLink href="?view=desktop" label="PC 화면" />
          </nav>

          <p className="mt-5 text-center text-[11px] leading-relaxed text-gray-500 sm:text-left">
            © {year} 호케이 Hokei · Ho Chi Minh Korean Community
          </p>
        </div>
      </div>
    </footer>
  );
}
