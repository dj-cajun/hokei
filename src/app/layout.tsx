import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";
import { pretendard } from "@/lib/fonts";
import { HeaderWrapper } from "@/components/layout/header-wrapper";
import { MobileNav } from "@/components/layout/mobile-nav";
import { SiteFooter } from "@/components/layout/site-footer";
import { LoginModalProvider } from "@/components/auth/login-modal-context";
import { AuthSessionProvider } from "@/components/providers/session-provider";
import { LoginErrorHandler } from "@/components/auth/login-error-handler";
import { SiteSocialAuth } from "@/components/auth/site-social-auth";
import { ToastProvider } from "@/components/providers/toast-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { WriteFab } from "@/components/layout/write-fab";
import { AdSenseScript } from "@/components/ads/adsense-script";
import { RegisterServiceWorker } from "@/components/pwa/register-service-worker";
import { SiteJsonLd } from "@/components/seo/site-json-ld";
import { resolveSiteUrl } from "@/lib/site-url";
import { getGoogleSiteVerification } from "@/lib/site-verification";
import {
  darkClassFromThemeCookie,
  THEME_COOKIE,
} from "@/lib/theme-cookie";

const siteUrl = resolveSiteUrl();
const googleVerification = getGoogleSiteVerification();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  ...(googleVerification
    ? { verification: { google: googleVerification } }
    : {}),
  title: "호케이 Hokei - 호치민 한국 교민 포털",
  description:
    "호케이(Hokei). 호치민 거주 한국 교민을 위한 현지 뉴스, 숙소, 구인, 생존 Q&A, 커뮤니티.",
  keywords:
    "호케이, Hokei, 사이공, 호치민, 한국교민, 베트남, 숙소, 구인",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "호케이",
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/icons/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/hokei-icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/hokei-icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      {
        url: "/icons/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
  openGraph: {
    title: "호케이 Hokei - 호치민 한국 교민 포털",
    description:
      "호치민 거주 한국 교민을 위한 현지 뉴스, 숙소, 구인, 생존 Q&A, 커뮤니티.",
    locale: "ko_KR",
    type: "website",
    siteName: "호케이 Hokei",
    images: [
      {
        url: "/icons/hokei-icon-512.png",
        width: 512,
        height: 512,
        alt: "호케이 Hokei",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "호케이 Hokei - 호치민 한국 교민 포털",
    description:
      "호치민 거주 한국 교민을 위한 현지 뉴스, 숙소, 구인, 생존 Q&A, 커뮤니티.",
    images: ["/icons/hokei-icon-512.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#c8102e",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const themeCookie = (await cookies()).get(THEME_COOKIE)?.value;
  const darkClass = darkClassFromThemeCookie(themeCookie);

  return (
    <html
      lang="ko"
      className={`${pretendard.variable} ${pretendard.className} h-full antialiased${darkClass ? ` ${darkClass}` : ""}`}
      suppressHydrationWarning
    >
      <body
        className="flex min-h-full flex-col bg-background pb-12 text-foreground lg:pb-0"
        suppressHydrationWarning
      >
        <SiteJsonLd />
        <ThemeProvider>
        <AuthSessionProvider>
          <ToastProvider>
          <LoginErrorHandler />
          <SiteSocialAuth />
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
            <div className="mx-auto mt-auto w-full max-w-6xl">
              <SiteFooter />
            </div>
            <MobileNav />
            <WriteFab />
          </LoginModalProvider>
          </ToastProvider>
        </AuthSessionProvider>
        </ThemeProvider>
        <AdSenseScript />
        <RegisterServiceWorker />
        <Analytics />
      </body>
    </html>
  );
}
