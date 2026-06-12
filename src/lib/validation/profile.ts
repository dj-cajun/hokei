import { z } from "zod";

const passwordField = z
  .string()
  .min(8, "비밀번호는 8자 이상이어야 합니다.")
  .regex(/[a-zA-Z]/, "비밀번호에 영문이 포함되어야 합니다.")
  .regex(/[0-9]/, "비밀번호에 숫자가 포함되어야 합니다.");

export const profileUpdateSchema = z.object({
  name: z.string().min(2, "닉네임은 2자 이상이어야 합니다.").max(30),
  avatarUrl: z
    .string()
    .url("올바른 이미지 URL을 입력해 주세요.")
    .max(500)
    .optional()
    .or(z.literal("")),
});

export const profilePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "현재 비밀번호를 입력해 주세요."),
    newPassword: passwordField,
    confirmPassword: z.string().min(1, "새 비밀번호 확인을 입력해 주세요."),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "새 비밀번호가 일치하지 않습니다.",
    path: ["confirmPassword"],
  });
