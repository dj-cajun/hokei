import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          { key: "X-DNS-Prefetch-Control", value: "on" },
        ],
      },
    ];
  },
  async redirects() {
    return [
      { source: "/housing", destination: "/real-estate", permanent: true },
      {
        source: "/quiz",
        destination: "/community/survival-qa",
        permanent: true,
      },
      {
        source: "/news/ho-chi-minh-live",
        destination: "/news",
        permanent: true,
      },
      {
        source: "/jobs/write",
        destination: "/write?section=jobs",
        permanent: false,
      },
      {
        source: "/real-estate/write",
        destination: "/write?section=real-estate",
        permanent: false,
      },
      {
        source: "/classifieds/write",
        destination: "/write?section=classifieds",
        permanent: false,
      },
      {
        source: "/community/write",
        destination: "/write?section=community",
        permanent: false,
      },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "**.vnexpress.net" },
      { protocol: "https", hostname: "**.naver.com" },
      { protocol: "https", hostname: "**.naver.net" },
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
    ],
  },
};

export default withSentryConfig(nextConfig, {
  silent: !process.env.CI,
  disableLogger: true,
  org: process.env.SENTRY_ORG ?? "nam-bac-technology-and-service",
  project: process.env.SENTRY_PROJECT ?? "javascript-nextjs",
});
