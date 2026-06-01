import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sentry 테스트 - 호케이",
  robots: { index: false, follow: false },
};

export default function SentryExampleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
