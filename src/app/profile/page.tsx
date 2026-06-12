import type { Metadata } from "next";
import Link from "next/link";
import { LayoutDashboard, Mail, Shield } from "lucide-react";
import { requireAuth } from "@/lib/auth-utils";
import { isOAuthOnlyUser } from "@/lib/profile";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Sidebar } from "@/components/layout/sidebar";
import { ProfileTabs } from "@/components/profile/profile-tabs";
import { ProfileBookmarks } from "@/components/profile/profile-bookmarks";
import { ProfileAvatar } from "@/components/profile/profile-avatar";
import { ProfileStats } from "@/components/profile/profile-stats";
import { ProfilePosts } from "@/components/profile/profile-posts";
import { ProfileComments } from "@/components/profile/profile-comments";
import { ProfileLikes } from "@/components/profile/profile-likes";
import { ProfileSettingsForm } from "@/components/profile/profile-settings-form";

export const metadata: Metadata = {
  title: "내 프로필 - 호케이 Hokei",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const session = await requireAuth();
  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      avatarUrl: true,
      kakaoId: true,
      password: true,
      createdAt: true,
    },
  });

  if (!dbUser) {
    return null;
  }

  const canChangePassword = !isOAuthOnlyUser(dbUser);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 gap-6 px-4 py-6">
      <Sidebar />
      <div className="min-w-0 flex-1">
        <div className="rounded-2xl bg-surface p-6 md:p-8">
          <div className="flex items-center gap-4">
            <ProfileAvatar name={dbUser.name} avatarUrl={dbUser.avatarUrl} />
            <div>
              <h1 className="text-xl font-bold">{dbUser.name}</h1>
              <p className="text-sm text-muted-foreground">{dbUser.email}</p>
              <span
                className={`mt-2 inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium ${
                  dbUser.role === "ADMIN"
                    ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"
                    : "bg-secondary text-muted-foreground"
                }`}
              >
                {dbUser.role === "ADMIN" ? (
                  <>
                    <Shield className="h-3 w-3" />
                    관리자
                  </>
                ) : (
                  "일반 회원"
                )}
              </span>
              <p className="mt-1 text-xs text-muted-foreground">
                가입일{" "}
                {dbUser.createdAt.toLocaleDateString("ko-KR", {
                  timeZone: "Asia/Ho_Chi_Minh",
                })}
              </p>
            </div>
          </div>

          <ProfileStats userId={dbUser.id} />

          <div className="mt-6">
            <Button asChild variant="outline">
              <Link href="/messages">
                <Mail className="mr-2 h-4 w-4" />
                쪽지함
              </Link>
            </Button>
          </div>

          <ProfileTabs
            tabs={[
              {
                id: "posts",
                label: "내 글",
                content: <ProfilePosts userId={dbUser.id} />,
              },
              {
                id: "comments",
                label: "댓글",
                content: <ProfileComments userId={dbUser.id} />,
              },
              {
                id: "likes",
                label: "좋아요",
                content: <ProfileLikes userId={dbUser.id} />,
              },
              {
                id: "bookmarks",
                label: "스크랩",
                content: <ProfileBookmarks userId={dbUser.id} />,
              },
              {
                id: "settings",
                label: "설정",
                content: (
                  <ProfileSettingsForm
                    initialName={dbUser.name}
                    initialAvatarUrl={dbUser.avatarUrl ?? ""}
                    email={dbUser.email}
                    canChangePassword={canChangePassword}
                  />
                ),
              },
            ]}
          />

          {dbUser.role === "ADMIN" && (
            <div className="mt-6">
              <Button asChild>
                <Link href="/admin">
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  관리자 대시보드 열기
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
