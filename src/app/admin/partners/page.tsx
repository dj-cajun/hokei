import Link from "next/link";
import { PartnersPanel } from "@/components/admin/partners-panel";

export default function AdminPartnersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">제휴 업소</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          모바일 LP·홈 배너용 업소를 등록합니다. 공개 목록은{" "}
          <Link href="/partners" className="text-primary hover:underline">
            /partners
          </Link>
          에 표시됩니다.
        </p>
      </div>
      <PartnersPanel />
    </div>
  );
}
