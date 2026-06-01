import { BoardPreviewSectionBox } from "@/components/home/board-preview-section";
import { getBoardPreviewSections } from "@/lib/data/board-preview";

export async function BoardPreviewList() {
  const sections = await getBoardPreviewSections();

  return (
    <div className="space-y-0">
      {sections.map((section) => (
        <BoardPreviewSectionBox key={section.title} section={section} />
      ))}
    </div>
  );
}
