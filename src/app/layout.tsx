import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";
import { pretendard } from "@/lib/fonts";
import { HeaderWrapper } from "@/components/layout/header-wrapper";
import { MobileNav } from "@/components/layout/mobile-nav";
import { LoginModalProvider } from "@/components/auth/login-modal-context";
import { AuthSessionProvider } from "@/components/providers/session-provider";
import { ToastProvider } from "@/components/providers/toast-provider";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
  "http://localhost:3001";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "호케이 Hokei - 호치민 한국 교민 포털",
  description:
    "호케이(Hokei). 호치민 거주 한국 교민을 위한 현지 뉴스, 숙소, 구인, 생존 퀴즈, 커뮤니티.",
  keywords:
    "호케이, Hokei, 사이공, 호치민, 한국교민, 베트남, 숙소, 구인",
  openGraph: {
    title: "호케이 Hokei - 호치민 한국 교민 포털",
    description:
      "호치민 거주 한국 교민을 위한 현지 뉴스, 숙소, 구인, 생존 퀴즈, 커뮤니티.",
    locale: "ko_KR",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0064ff",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${pretendard.variable} h-full antialiased`}>
      <body
        className={`${pretendard.className} flex min-h-full flex-col pb-12 lg:pb-0`}
      >
        <AuthSessionProvider>
          <ToastProvider>
          <LoginModalProvider>
            <a
              href="#main-content"
              className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-[100] focus:rounded-sm focus:bg-[#0f172a] focus:px-3 focus:py-2 focus:text-xs focus:font-semibold focus:text-white"
            >
              본문 바로가기
            </a>
            <HeaderWrapper />
            <main id="main-content" className="flex flex-1 flex-col">
              {children}
            </main>
            <MobileNav />
          </LoginModalProvider>
          </ToastProvider>
        </AuthSessionProvider>
        <Analytics />
      </body>
    </html>
  );
}
