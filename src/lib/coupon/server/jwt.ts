import { SignJWT, jwtVerify, type JWTPayload } from "jose";

function getSecretKey(): Uint8Array {
  const secret =
    process.env.COUPON_JWT_SECRET?.trim() || process.env.AUTH_SECRET?.trim();
  if (!secret) {
    throw new Error("COUPON_JWT_SECRET or AUTH_SECRET is required");
  }
  return new TextEncoder().encode(secret);
}

export async function signCouponJwt(
  payload: JWTPayload,
  expiresIn: string,
): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(getSecretKey());
}

export async function verifyCouponJwt<T extends JWTPayload = JWTPayload>(
  token: string,
): Promise<T> {
  const { payload } = await jwtVerify(token, getSecretKey());
  return payload as T;
}
