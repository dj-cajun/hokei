import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60dvh] max-w-[480px] flex-col items-center justify-center gap-3 px-4 text-center">
      <p className="text-4xl font-bold text-gray-200">404</p>
      <h1 className="text-lg font-bold text-gray-900">페이지를 찾을 수 없습니다</h1>
      <p className="text-sm text-gray-500">
        주소가 잘못되었거나 삭제된 페이지일 수 있습니다.
      </p>
      <Link
        href="/"
        className="mt-2 rounded-sm bg-[#0f172a] px-4 py-2 text-sm font-semibold text-white"
      >
        홈으로 돌아가기
      </Link>
    </div>
  );
}
