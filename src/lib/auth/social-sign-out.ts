import { signOut as nextAuthSignOut } from "next-auth/react";
import { disableGoogleAutoSelectOnLogout } from "@/lib/auth/google-one-tap";

type SignOutOptions = Parameters<typeof nextAuthSignOut>[0];

/**
 * NextAuth signOut + Google One Tap auto_select 비활성화
 * (의도적 로그아웃 후 원탭 무한 자동 로그인 방지)
 */
export async function socialSignOut(options?: SignOutOptions) {
  disableGoogleAutoSelectOnLogout();
  await nextAuthSignOut(options);
}
