import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { CategoryIcon } from "@/components/category/category-icon";
import { SectionWriteLink } from "@/components/layout/section-write-link";
import { Sidebar } from "@/components/layout/sidebar";
import { isWritableSection } from "@/lib/write-sections";

interface SectionPageProps {
  sectionSlug: string;
  label: string;
  colorClass: string;
  href: string;
  subcategories: {
    id: string;
    label: string;
    description: string | null;
    href: string;
    icon: string;
  }[];
}

export function SectionPage({
  sectionSlug,
  label,
  colorClass,
  subcategories,
}: SectionPageProps) {
  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-1 px-2 py-2 lg:max-w-6xl lg:flex-row lg:gap-6 lg:px-4 lg:py-6">
      <Sidebar />
      <main className="min-w-0 flex-1 space-y-1">
        <div className="flex items-start justify-between gap-2 bg-white px-2 py-2 lg:rounded-xl lg:p-5">
          <div className="min-w-0">
            <h1 className="text-base font-bold leading-snug lg:text-lg">{label}</h1>
          </div>
          {isWritableSection(sectionSlug) && (
            <SectionWriteLink sectionSlug={sectionSlug} />
          )}
        </div>

        <section className="divide-y divide-[#f3f4f6] bg-white">
          {subcategories.map((child) => (
            <Link
              key={child.id}
              href={child.href}
              className="flex items-center justify-between gap-2 px-2 py-2 active:bg-secondary/80"
            >
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-sm ${colorClass}`}
                >
                  <CategoryIcon name={child.icon} className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <h2 className="truncate text-sm font-medium leading-snug">
                    {child.label}
                  </h2>
                  {child.description && (
                    <p className="line-clamp-1 text-[11px] text-gray-400">
                      {child.description}
                    </p>
                  )}
                </div>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-gray-300" />
            </Link>
          ))}
        </section>
      </main>
    </div>
  );
}
