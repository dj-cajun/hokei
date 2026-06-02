import { ModerationPanel } from "@/components/admin/moderation-panel";

export default function AdminModerationPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">콘텐츠 모더레이션</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          게시글·댓글 검색, 숨김·복구·일괄 처리, 신고 큐
        </p>
      </div>
      <ModerationPanel />
    </div>
  );
}
