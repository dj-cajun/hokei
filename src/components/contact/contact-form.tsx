"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { parseApiError } from "@/lib/api-response";

export type ContactInquiryKind = "general" | "ads";

type ContactFormProps = {
  generalEmail: string;
  adEmail: string;
  defaultKind?: ContactInquiryKind;
};

export function ContactForm({
  generalEmail,
  adEmail,
  defaultKind = "general",
}: ContactFormProps) {
  const [kind, setKind] = useState<ContactInquiryKind>(defaultKind);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const recipient = kind === "ads" ? adEmail : generalEmail;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);
    setError(null);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind,
          name: name.trim(),
          email: email.trim(),
          subject: subject.trim(),
          body: body.trim(),
        }),
      });
      const data = (await res.json()) as { ok?: boolean; message?: string };
      if (!res.ok || !data.ok) {
        setError(parseApiError(data) ?? "전송에 실패했습니다.");
        return;
      }
      setMessage(data.message ?? "문의가 접수되었습니다.");
      setSubject("");
      setBody("");
    } catch {
      setError("네트워크 오류입니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3 rounded-xl border border-border bg-surface p-4"
    >
      <div>
        <span className="text-sm font-medium">문의 유형</span>
        <div className="mt-2 flex flex-wrap gap-2">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm has-[:checked]:border-primary has-[:checked]:bg-primary/5">
            <input
              type="radio"
              name="inquiry-kind"
              value="general"
              checked={kind === "general"}
              onChange={() => setKind("general")}
              className="accent-primary"
            />
            일반 문의
          </label>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm has-[:checked]:border-primary has-[:checked]:bg-primary/5">
            <input
              type="radio"
              name="inquiry-kind"
              value="ads"
              checked={kind === "ads"}
              onChange={() => setKind("ads")}
              className="accent-primary"
            />
            광고·제휴
          </label>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          수신 주소: <span className="font-medium text-foreground">{recipient}</span>
        </p>
      </div>
      <div>
        <label htmlFor="contact-name" className="text-sm font-medium">
          이름
        </label>
        <input
          id="contact-name"
          name="name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
          autoComplete="name"
        />
      </div>
      <div>
        <label htmlFor="contact-email" className="text-sm font-medium">
          회신 이메일
        </label>
        <input
          id="contact-email"
          name="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
          autoComplete="email"
        />
      </div>
      <div>
        <label htmlFor="contact-subject" className="text-sm font-medium">
          제목
        </label>
        <input
          id="contact-subject"
          name="subject"
          required
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder={
            kind === "ads" ? "예: 메인 배너 광고 문의" : "예: 계정 로그인 문의"
          }
          className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label htmlFor="contact-body" className="text-sm font-medium">
          내용
        </label>
        <textarea
          id="contact-body"
          name="body"
          required
          rows={5}
          minLength={10}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={
            kind === "ads"
              ? "희망 게재 위치, 기간, 업종, 예산(선택)을 적어 주세요."
              : undefined
          }
          className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
        />
      </div>
      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? "전송 중…" : "문의 보내기"}
      </Button>
      {message ? (
        <p className="text-sm text-green-600 dark:text-green-400" role="status">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}{" "}
          <a href={`mailto:${recipient}`} className="underline">
            {recipient}
          </a>
          로 직접 메일해 주세요.
        </p>
      ) : null}
      <p className="text-xs text-muted-foreground">
        메일 앱이 없어도 위 폼으로 바로 접수됩니다. 평일 2~3영업일 내 답변드립니다.
      </p>
    </form>
  );
}
