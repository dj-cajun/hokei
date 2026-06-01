import { Play } from "lucide-react";

export function HomeVideoHighlight() {
  return (
    <section className="bg-white px-3 pb-3 pt-2" aria-label="하이라이트 영상">
      <div className="relative aspect-video w-full overflow-hidden rounded-sm bg-neutral-800">
        <div
          className="absolute inset-0 bg-gradient-to-br from-neutral-700 to-neutral-900"
          aria-hidden
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-black/50 text-white shadow-lg backdrop-blur-sm">
            <Play className="h-7 w-7 fill-white pl-0.5" />
          </span>
        </div>
      </div>
      <h2 className="mt-2 line-clamp-2 text-sm font-bold leading-snug text-gray-900">
        배우동문회 50주년 기념 행사 — 호치민 한인 커뮤니티 하이라이트
      </h2>
      <p className="mt-0.5 text-[11px] text-gray-400">조회 1,240 · 2026.06.01</p>
    </section>
  );
}
