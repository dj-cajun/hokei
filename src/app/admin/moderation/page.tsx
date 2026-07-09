import { ModerationPanel } from "@/components/admin/moderation-panel";

export default function AdminModerationPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">콘텐츠 모더레이션</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          게시글·댓글 검색, 일괄 선택·삭제, 금지어, 신고 큐
        </p>
      </div>
      <ModerationPanel />
    </div>
  );
}
