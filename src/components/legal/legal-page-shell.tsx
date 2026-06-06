import Link from "next/link";
import { ChevronLeft } from "lucide-react";

type LegalPageShellProps = {
  title: string;
  updatedAt: string;
  children: React.ReactNode;
};

export function LegalPageShell({
  title,
  updatedAt,
  children,
}: LegalPageShellProps) {
  return (
    <div className="mx-auto w-full max-w-[480px] flex-1 px-4 py-6 lg:max-w-3xl lg:py-10">
      <Link
        href="/"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
      >
        <ChevronLeft className="h-4 w-4" />
        홈으로
      </Link>
      <h1 className="text-xl font-bold lg:text-2xl">{title}</h1>
      <p className="mt-1 text-xs text-muted-foreground">최종 수정: {updatedAt}</p>
      <div className="prose-legal mt-6 space-y-4 text-sm leading-relaxed text-gray-700">
        {children}
      </div>
    </div>
  );
}
