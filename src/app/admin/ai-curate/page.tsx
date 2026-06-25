import { AiCuratePanel } from "@/components/admin/ai-curate-panel";

export default function AdminAiCuratePage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">AI 카톡 큐레이션</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          카톡 대화록을 붙여넣으면 Gemini가 베트남어 공부·부동산·중고·구인·업소
          홍보를 분류해 해당 게시판으로 발행합니다.
        </p>
      </div>
      <AiCuratePanel />
    </div>
  );
}
