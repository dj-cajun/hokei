import { getContactInboxEmail } from "@/lib/contact-emails";
import { log } from "@/lib/logger";

export type ContactInquiryKind = "general" | "ads";

type SendContactEmailInput = {
  kind: ContactInquiryKind;
  name: string;
  replyTo: string;
  subject: string;
  body: string;
};

function inboxForKind(kind: ContactInquiryKind): string {
  return getContactInboxEmail(kind);
}

function kindLabel(kind: ContactInquiryKind): string {
  return kind === "ads" ? "광고·제휴" : "일반";
}

export async function sendContactEmail(
  input: SendContactEmailInput
): Promise<{ sent: boolean }> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from =
    process.env.EMAIL_FROM?.trim() ?? "Hokei <hello@hokei.vn>";
  const to = inboxForKind(input.kind);

  const subject = `[호케이 ${kindLabel(input.kind)}] ${input.subject}`;
  const html = `
    <p><strong>유형:</strong> ${kindLabel(input.kind)}</p>
    <p><strong>이름:</strong> ${escapeHtml(input.name)}</p>
    <p><strong>회신:</strong> <a href="mailto:${escapeHtml(input.replyTo)}">${escapeHtml(input.replyTo)}</a></p>
    <hr />
    <pre style="white-space:pre-wrap;font-family:inherit">${escapeHtml(input.body)}</pre>
  `.trim();

  if (!apiKey) {
    log("warn", "[contact] RESEND_API_KEY 없음", { to, subject });
    return { sent: false };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      reply_to: [input.replyTo],
      subject,
      html,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    log("error", "[contact] Resend 실패", {
      status: res.status,
      body: errText.slice(0, 300),
      to,
    });
    return { sent: false };
  }

  return { sent: true };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
