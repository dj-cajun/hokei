import { SignJWT, decodeJwt, jwtVerify } from "jose";
import { randomUUID } from "crypto";

export interface RedemptionJwtPayload {
  jti: string;
  cid: string;
  exp: number;
  iat: number;
}

function getSecretKey(): Uint8Array {
  const secret =
    process.env.REDEMPTION_SIGNING_SECRET ??
    "dev-redemption-secret-min-32-chars!!";
  return new TextEncoder().encode(secret);
}

function getSiteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    "http://localhost:3001"
  );
}

const ttlSec = Number(process.env.REDEMPTION_TTL_SEC ?? 180);

export function redemptionTtlSec(): number {
  return ttlSec;
}

export function newRedemptionJti(): string {
  return randomUUID();
}

export async function signRedemptionToken(
  jti: string,
  walletItemId: string,
): Promise<{ token: string; qrPayload: string; expiresAt: Date }> {
  const now = Math.floor(Date.now() / 1000);
  const exp = now + ttlSec;
  const token = await new SignJWT({ jti, cid: walletItemId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt(now)
    .setExpirationTime(exp)
    .sign(getSecretKey());

  const siteUrl = getSiteUrl();
  const qrPayload = `${siteUrl}/r/${token}`;
  return { token, qrPayload, expiresAt: new Date(exp * 1000) };
}

export async function verifyRedemptionToken(
  token: string,
  options?: { ignoreExpiration?: boolean },
): Promise<RedemptionJwtPayload> {
  const secret = getSecretKey();
  if (options?.ignoreExpiration) {
    const decoded = decodeJwt(token) as RedemptionJwtPayload;
    const expMs = (decoded.exp ?? 0) * 1000;
    const { payload } = await jwtVerify(token, secret, {
      currentDate: new Date(expMs > 0 ? expMs : Date.now()),
    });
    return payload as unknown as RedemptionJwtPayload;
  }
  const { payload } = await jwtVerify(token, secret);
  return payload as unknown as RedemptionJwtPayload;
}

export function extractTokenFromQrPayload(qrPayload: string): string {
  const trimmed = qrPayload.trim();
  const siteUrl = getSiteUrl();
  const prefix = `${siteUrl}/r/`;
  if (trimmed.startsWith(prefix)) {
    return trimmed.slice(prefix.length);
  }
  if (trimmed.includes("/r/")) {
    return trimmed.split("/r/").pop() ?? trimmed;
  }
  return trimmed;
}
