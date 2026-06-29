import Link from "next/link";
import { notFound } from "next/navigation";
import { isCouponStore, storeCouponBase } from "@/lib/coupon/config";

export default async function CouponTermsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!isCouponStore(slug)) notFound();

  const base = storeCouponBase(slug);

  return (
    <div className="mx-auto max-w-lg flex-1 px-4 py-8">
      <Link href={base} className="text-sm text-muted-foreground hover:text-primary">
        ← 쿠폰 구매
      </Link>
      <h1 className="mt-4 text-xl font-bold">O2O 쿠폰 이용 안내</h1>
      <div className="prose prose-sm mt-4 max-w-none text-sm text-foreground">
        <p>
          본 쿠폰은 호케이를 통해 발급되는 <strong>교환권</strong>입니다. 음료 대금은
          업소(2D SKETCH CAFE) 계좌 QR 또는 매장 현금으로 <strong>업소에 직접</strong>{" "}
          결제합니다.
        </p>
        <ul className="list-disc pl-5">
          <li>QR 코드는 발급 후 약 3분간 유효하며, 1회 사용 후 재사용할 수 없습니다.</li>
          <li>환불·취소는 업소 정책 및 현지 법령에 따릅니다.</li>
          <li>
            플랫폼 수수료는 교환(스캔) 시 업소와 K BROTHERS 간 별도 정산됩니다.
          </li>
          <li>문의는 결제 후 열리는 쪽지함 또는 매장 직원에게 연락해 주세요.</li>
        </ul>
        <p className="text-xs text-muted-foreground">
          정식 약관·제휴 계약은 런칭 전 법무 검토본으로 교체됩니다. (docs/coupon-o2o/LEGAL.md)
        </p>
      </div>
    </div>
  );
}
