import { log } from "@/lib/logger";
import { resolveSiteUrl } from "@/lib/site-url";

type SendVerificationEmailInput = {
  to: string;
  name: string;
  verifyUrl: string;
};

export async function sendVerificationEmail(
  input: SendVerificationEmailInput
): Promise<{ sent: boolean; devLogged?: boolean }> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from =
    process.env.EMAIL_FROM?.trim() ?? "Hokei <onboarding@resend.dev>";

  const subject = "[호케이] 이메일 인증을 완료해 주세요";
  const html = `
    <p>${input.name}님, 호케이 가입을 환영합니다.</p>
    <p>아래 버튼을 눌러 이메일 인증을 완료한 뒤 로그인해 주세요. (24시간 유효)</p>
    <p><a href="${input.verifyUrl}" style="display:inline-block;padding:12px 20px;background:#0064ff;color:#fff;text-decoration:none;border-radius:8px;">이메일 인증하기</a></p>
    <p style="color:#666;font-size:12px;">버튼이 안 보이면 링크를 복사하세요:<br>${input.verifyUrl}</p>
  `.trim();

  if (!apiKey) {
    log("warn", "[email] RESEND_API_KEY 없음 — 개발 모드 인증 링크", {
      to: input.to,
      verifyUrl: input.verifyUrl,
    });
    return { sent: false, devLogged: true };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [input.to],
      subject,
      html,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    log("error", "[email] Resend 실패", {
      status: res.status,
      body: errText.slice(0, 300),
      from,
      to: input.to,
    });
    return { sent: false };
  }

  return { sent: true };
}

export function buildVerifyEmailUrl(token: string): string {
  const base = resolveSiteUrl();
  return `${base}/api/auth/verify-email?token=${encodeURIComponent(token)}`;
}
