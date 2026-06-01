export type GoogleTokenProfile = {
  sub: string;
  email: string;
  name: string;
  picture?: string;
};

function getGoogleClientId(): string | undefined {
  return (
    process.env.GOOGLE_CLIENT_ID?.trim() ||
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim()
  );
}

/** Google ID 토큰 검증 (tokeninfo) */
export async function verifyGoogleIdToken(
  idToken: string
): Promise<GoogleTokenProfile | null> {
  const clientId = getGoogleClientId();
  if (!clientId || !idToken.trim()) return null;

  try {
    const res = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`
    );
    if (!res.ok) return null;

    const data = (await res.json()) as {
      aud?: string;
      sub?: string;
      email?: string;
      email_verified?: string | boolean;
      name?: string;
      picture?: string;
      exp?: string;
    };

    if (data.aud !== clientId) return null;
    if (!data.sub || !data.email) return null;

    const emailVerified =
      data.email_verified === true || data.email_verified === "true";
    if (!emailVerified) return null;

    if (data.exp && Number(data.exp) * 1000 < Date.now()) return null;

    return {
      sub: data.sub,
      email: data.email,
      name: data.name?.trim() || data.email.split("@")[0] || "사용자",
      picture: data.picture,
    };
  } catch {
    return null;
  }
}
