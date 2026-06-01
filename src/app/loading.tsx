export default function GlobalLoading() {
  return (
    <div className="mx-auto flex min-h-[40dvh] max-w-[480px] items-center justify-center">
      <div className="flex flex-col items-center gap-2">
        <div
          className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-[#0f172a]"
          aria-hidden
        />
        <p className="text-xs text-gray-400">불러오는 중…</p>
      </div>
    </div>
  );
}
