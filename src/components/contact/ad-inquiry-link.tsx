import Link from "next/link";
import { Mail } from "lucide-react";

/** 푸터 등 — mailto 대신 문의 페이지로 연결 (PWA·모바일 호환) */
export function AdInquiryLink({
  email,
  className,
}: {
  email: string;
  className?: string;
}) {
  return (
    <Link href="/contact?kind=ads" className={className}>
      <Mail className="h-3.5 w-3.5 shrink-0" aria-hidden />
      광고·제휴 문의: {email}
    </Link>
  );
}
