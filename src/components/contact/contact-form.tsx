"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

type ContactFormProps = {
  contactEmail: string;
};

export function ContactForm({ contactEmail }: ContactFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const lines = [
      `이름: ${name.trim()}`,
      `회신 이메일: ${email.trim()}`,
      "",
      body.trim(),
    ];
    const mailto = `mailto:${contactEmail}?subject=${encodeURIComponent(subject.trim())}&body=${encodeURIComponent(lines.join("\n"))}`;
    window.location.href = mailto;
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3 rounded-xl border border-border bg-surface p-4"
    >
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
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
        />
      </div>
      <Button type="submit" className="w-full">
        메일 앱으로 보내기
      </Button>
      <p className="text-xs text-muted-foreground">
        제출 시 기본 메일 앱이 열립니다. 평일 2~3영업일 내 답변드립니다.
      </p>
    </form>
  );
}
