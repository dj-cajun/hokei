import type { Metadata } from "next";
import Link from "next/link";
import { ContactForm } from "@/components/contact/contact-form";
import { LegalPageShell } from "@/components/legal/legal-page-shell";
import { getAdContactEmail, getContactEmail } from "@/lib/contact-emails";

export const metadata: Metadata = {
  title: "문의하기 - 호케이 Hokei",
  description: "호케이 운영팀·광고 제휴 문의",
};

const UPDATED = "2026년 6월 26일";

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ kind?: string }>;
}) {
  const contactEmail = getContactEmail();
  const adEmail = getAdContactEmail();
  const { kind } = await searchParams;
  const defaultKind = kind === "ads" ? "ads" : "general";

  return (
    <LegalPageShell title="문의하기" updatedAt={UPDATED}>
      <p>
        서비스 이용·개인정보·오류는 일반 문의로, 배너·제휴·광고 집행은 광고 문의로
        연락해 주세요.
      </p>

      <section className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-surface p-4">
          <h2 className="text-sm font-semibold text-foreground">일반 문의</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            계정, 게시글, 개인정보, 오류 신고
          </p>
          <a
            href={`mailto:${contactEmail}`}
            className="mt-2 inline-block text-sm text-primary hover:underline"
          >
            {contactEmail}
          </a>
        </div>
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
          <h2 className="text-sm font-semibold text-foreground">광고·제휴 문의</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            메인·게시판 배너, 업소 홍보, 스폰서십
          </p>
          <a
            href={`mailto:${adEmail}`}
            className="mt-2 inline-block text-sm font-semibold text-primary hover:underline"
          >
            {adEmail}
          </a>
        </div>
      </section>

      <ContactForm
        generalEmail={contactEmail}
        adEmail={adEmail}
        defaultKind={defaultKind}
      />

      <section>
        <h2 className="text-base font-semibold text-foreground">자주 문의하는 항목</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>계정·로그인: Google 로그인 또는 이메일 인증 가입</li>
          <li>게시글·댓글 삭제: 본인 글은 글 상세에서 수정·삭제</li>
          <li>신고 처리: 관리자 검토 후 조치</li>
          <li>
            광고·제휴: 푸터 또는{" "}
            <a href={`mailto:${adEmail}`} className="text-primary hover:underline">
              {adEmail}
            </a>
          </li>
          <li>
            개인정보:{" "}
            <Link href="/privacy" className="text-primary hover:underline">
              개인정보처리방침
            </Link>{" "}
            참고
          </li>
        </ul>
      </section>
    </LegalPageShell>
  );
}
