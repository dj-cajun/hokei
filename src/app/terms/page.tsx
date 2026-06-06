import type { Metadata } from "next";
import Link from "next/link";
import { LegalPageShell } from "@/components/legal/legal-page-shell";

export const metadata: Metadata = {
  title: "이용약관 - 호케이 Hokei",
  description: "호케이(Hokei) 서비스 이용약관",
};

const UPDATED = "2026년 6월 6일";

export default function TermsPage() {
  return (
    <LegalPageShell title="이용약관" updatedAt={UPDATED}>
      <p>
        본 약관은 호케이 Hokei(이하 &quot;서비스&quot;)의 이용 조건을 정합니다.
        서비스를 이용하면 본 약관에 동의한 것으로 간주합니다.
      </p>

      <section>
        <h2 className="text-base font-semibold text-foreground">1. 서비스 내용</h2>
        <p className="mt-2">
          호치민 한국 교민을 위한 뉴스, 커뮤니티, 부동산·벼룩시장·구인 게시판,
          쪽지, 좋아요 등 정보 공유 서비스를 제공합니다.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-foreground">2. 회원 의무</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>타인의 권리를 침해하거나 불법·음란·혐오 콘텐츠를 게시하지 않습니다.</li>
          <li>부동산·중고 거래 시 허위·과장 정보를 게시하지 않습니다.</li>
          <li>쪽지 기능을 스팸·광고·괴롭힘에 사용하지 않습니다.</li>
          <li>계정을 타인에게 양도·대여하지 않습니다.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-base font-semibold text-foreground">3. 게시물</h2>
        <p className="mt-2">
          이용자가 게시한 콘텐츠의 책임은 이용자에게 있습니다. 서비스는 약관·법령
          위반 게시물을 사전 통지 없이 숨김·삭제할 수 있으며, 신고·모더레이션
          정책을 운영합니다.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-foreground">4. 거래 면책</h2>
        <p className="mt-2">
          회원 간 부동산·중고·구인 거래는 이용자 간 직접 이루어지며, 서비스는
          거래의 당사자가 아닙니다. 분쟁·손해에 대해 법령이 허용하는 범위 내에서
          책임을 지지 않습니다. 쪽지로 연락하더라도 현장 확인·계약은 이용자
          책임입니다.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-foreground">5. 서비스 변경·중단</h2>
        <p className="mt-2">
          운영상·기술상 필요에 따라 서비스의 전부 또는 일부를 변경·중단할 수
          있습니다.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-foreground">6. 문의</h2>
        <p className="mt-2">
          <Link href="/contact" className="text-primary hover:underline">
            문의하기
          </Link>
          페이지를 이용해 주세요.
        </p>
      </section>
    </LegalPageShell>
  );
}
