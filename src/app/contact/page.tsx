import type { Metadata } from "next";
import Link from "next/link";
import { ContactForm } from "@/components/contact/contact-form";
import { LegalPageShell } from "@/components/legal/legal-page-shell";

export const metadata: Metadata = {
  title: "문의하기 - 호케이 Hokei",
  description: "호케이 운영팀 문의",
};

const UPDATED = "2026년 6월 6일";
const CONTACT_EMAIL =
  process.env.CONTACT_EMAIL?.trim() ?? "webmaster@hokei.vn";

export default function ContactPage() {
  return (
    <LegalPageShell title="문의하기" updatedAt={UPDATED}>
      <p>
        서비스 이용, 개인정보, 광고·제휴, 오류 신고 등은 아래로 연락해 주세요.
      </p>

      <ContactForm contactEmail={CONTACT_EMAIL} />

      <p className="text-xs text-muted-foreground">
        직접 메일:{" "}
        <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary hover:underline">
          {CONTACT_EMAIL}
        </a>
      </p>

      <section>
        <h2 className="text-base font-semibold text-foreground">자주 문의하는 항목</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>계정·로그인: Google 로그인 또는 이메일 인증 가입</li>
          <li>게시글·댓글 삭제: 본인 글은 글 상세에서 수정·삭제</li>
          <li>신고 처리: 관리자 검토 후 조치</li>
          <li>개인정보: <Link href="/privacy" className="text-primary hover:underline">개인정보처리방침</Link> 참고</li>
        </ul>
      </section>
    </LegalPageShell>
  );
}
