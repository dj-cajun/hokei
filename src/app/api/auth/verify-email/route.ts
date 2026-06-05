import { verifyEmailToken } from "@/lib/auth/email-verification";
import { resolveSiteUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token") ?? "";
  const base = resolveSiteUrl();
  const result = await verifyEmailToken(token);

  if (!result.ok) {
    const reason =
      result.reason === "expired" ? "expired" : "invalid";
    return Response.redirect(`${base}/verify-email?error=${reason}`);
  }

  const email = encodeURIComponent(result.email);
  return Response.redirect(`${base}/login?verified=1&email=${email}`);
}
