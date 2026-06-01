import { requireAdmin } from "@/lib/auth-utils";
import { AdminSidebar } from "@/components/admin/admin-sidebar";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "관리자 - 호케이 Hokei",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-6 lg:flex-row">
      <AdminSidebar />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
