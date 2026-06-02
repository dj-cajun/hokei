import { SecurityPanel } from "@/components/admin/security-panel";

export default function AdminSecurityPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">보안·감사</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          IP 차단 · 관리자 행위 감사 로그
        </p>
      </div>
      <SecurityPanel />
    </div>
  );
}
