import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: "Sentry 테스트 - 호케이",
  robots: { index: false, follow: false },
};

export default function SentryExampleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }
  return children;
}
