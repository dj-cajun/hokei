import { PartnersPanel } from "@/components/admin/partners-panel";

export default function AdminPartnersPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold">제휴 업소</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          모바일 LP, 제휴 허브, 홈 배너 슬롯을 관리합니다.
        </p>
      </div>
      <PartnersPanel />
    </div>
  );
}
