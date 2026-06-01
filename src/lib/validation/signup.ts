import { z } from "zod";

export const signupSchema = z.object({
  name: z.string().min(2, "이름은 2자 이상이어야 합니다."),
  email: z.string().email("올바른 이메일을 입력해 주세요."),
  password: z
    .string()
    .min(8, "비밀번호는 8자 이상이어야 합니다.")
    .regex(/[a-zA-Z]/, "비밀번호에 영문이 포함되어야 합니다.")
    .regex(/[0-9]/, "비밀번호에 숫자가 포함되어야 합니다."),
});

export type SignupInput = z.infer<typeof signupSchema>;
