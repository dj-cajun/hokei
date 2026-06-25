import { AdminLifePanel } from "@/components/admin/admin-life-panel";

export default function AdminLifePage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold">생활 가이드</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          의식주 위키·자료실·베트남어 공부를 수동 등록합니다. 카톡 일괄 처리는{" "}
          <a href="/admin/ai-curate" className="text-primary hover:underline">
            AI 카톡 큐레이션
          </a>
          을 이용하세요.
        </p>
      </div>
      <AdminLifePanel />
    </div>
  );
}
