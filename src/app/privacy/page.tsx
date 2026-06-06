import type { Metadata } from "next";
import Link from "next/link";
import { LegalPageShell } from "@/components/legal/legal-page-shell";
import { resolveSiteUrl } from "@/lib/site-url";

export const metadata: Metadata = {
  title: "개인정보처리방침 - 호케이 Hokei",
  description: "호케이(Hokei) 호치민 한국 교민 포털 개인정보처리방침",
};

const UPDATED = "2026년 6월 6일";
const SITE = resolveSiteUrl();

export default function PrivacyPage() {
  return (
    <LegalPageShell title="개인정보처리방침" updatedAt={UPDATED}>
      <p>
        호케이 Hokei(이하 &quot;서비스&quot;)는 호치민 거주 한국 교민 커뮤니티 포털로,
        이용자의 개인정보를 중요하게 생각하며 「개인정보 보호법」 등 관련 법령을
        준수합니다.
      </p>

      <section>
        <h2 className="text-base font-semibold text-foreground">1. 수집하는 개인정보</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>회원가입: 이메일, 이름, 비밀번호(암호화 저장)</li>
          <li>소셜 로그인(Google): 이메일, 이름, 프로필 식별자</li>
          <li>서비스 이용: 게시글·댓글·쪽지·좋아요·신고 내역, IP(보안·남용 방지)</li>
          <li>자동 수집: 쿠키, 접속 로그, 기기·브라우저 정보(Analytics)</li>
        </ul>
      </section>

      <section>
        <h2 className="text-base font-semibold text-foreground">2. 이용 목적</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>회원 식별, 인증, 커뮤니티·거래 게시판 서비스 제공</li>
          <li>쪽지(DM), 좋아요, 알림 등 소셜 기능 제공</li>
          <li>스팸·광고·욕설 등 콘텐츠 모더레이션 및 분쟁 처리</li>
          <li>서비스 개선, 통계, 맞춤형 콘텐츠·광고(AdSense 등) 제공</li>
        </ul>
      </section>

      <section>
        <h2 className="text-base font-semibold text-foreground">3. 보관 기간</h2>
        <p className="mt-2">
          회원 탈퇴 시 지체 없이 파기합니다. 다만 관계 법령에 따라 일정 기간 보관할
          수 있습니다. 쪽지·게시 기록은 분쟁 해결·모더레이션 목적으로 탈퇴 후 최대
          90일 보관 후 삭제할 수 있습니다.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-foreground">4. 제3자 제공</h2>
        <p className="mt-2">
          원칙적으로 이용자 동의 없이 제3자에게 제공하지 않습니다. 다만 서비스
          운영을 위해 아래 수탁·연동 업체에 필요한 범위에서 처리될 수 있습니다.
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>호스팅·DB: Vercel, Neon PostgreSQL</li>
          <li>이메일 발송: Resend(가입 인증 메일)</li>
          <li>소셜 로그인: Google OAuth</li>
          <li>광고: Google AdSense(쿠키·광고 ID — 동의 시)</li>
          <li>분석: Vercel Analytics</li>
        </ul>
      </section>

      <section>
        <h2 className="text-base font-semibold text-foreground">5. 이용자 권리</h2>
        <p className="mt-2">
          이용자는 개인정보 열람·정정·삭제·처리 정지를 요청할 수 있습니다.{" "}
          <Link href="/contact" className="text-primary hover:underline">
            문의하기
          </Link>
          또는 {SITE.replace(/^https?:\/\//, "")} 관리자에게 연락해 주세요.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-foreground">6. 쿠키</h2>
        <p className="mt-2">
          로그인 세션, 조회수 중복 방지, PWA 설치, 광고·분석 목적으로 쿠키를
          사용합니다. 브라우저 설정에서 거부할 수 있으나 일부 기능이 제한될 수
          있습니다.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-foreground">7. 문의</h2>
        <p className="mt-2">
          개인정보 보호 책임: 호케이 운영팀 ·{" "}
          <a href="mailto:webmaster@hokei.vn" className="text-primary hover:underline">
            webmaster@hokei.vn
          </a>
        </p>
      </section>
    </LegalPageShell>
  );
}
