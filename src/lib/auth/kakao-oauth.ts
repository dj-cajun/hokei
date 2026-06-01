export type KakaoProfile = {
  id: string;
  email: string;
  name: string;
};

function getKakaoRestApiKey(): string | undefined {
  return process.env.KAKAO_REST_API_KEY?.trim();
}

export function getKakaoRedirectUri(siteUrl?: string): string {
  const base =
    siteUrl?.replace(/\/$/, "") ||
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "";
  return base ? `${base}/api/auth/kakao/callback` : "";
}

/** authorization code → 액세스 토큰 → 프로필 */
export async function fetchKakaoProfileFromCode(
  code: string,
  redirectUri: string
): Promise<KakaoProfile | null> {
  const restKey = getKakaoRestApiKey();
  if (!restKey || !code || !redirectUri) return null;

  const tokenRes = await fetch("https://kauth.kakao.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: restKey,
      redirect_uri: redirectUri,
      code,
    }),
  });

  if (!tokenRes.ok) return null;

  const tokenData = (await tokenRes.json()) as { access_token?: string };
  if (!tokenData.access_token) return null;

  const userRes = await fetch("https://kapi.kakao.com/v2/user/me", {
    headers: {
      Authorization: `Bearer ${tokenData.access_token}`,
      "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
    },
  });

  if (!userRes.ok) return null;

  const user = (await userRes.json()) as {
    id?: number;
    kakao_account?: {
      email?: string;
      profile?: { nickname?: string };
    };
  };

  const kakaoId = user.id != null ? String(user.id) : "";
  if (!kakaoId) return null;

  const email =
    user.kakao_account?.email?.trim() ||
    `kakao_${kakaoId}@users.hokei.local`;

  const name =
    user.kakao_account?.profile?.nickname?.trim() || `카카오사용자${kakaoId}`;

  return { id: kakaoId, email: email.toLowerCase(), name };
}
