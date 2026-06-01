"use client";

import { Slot } from "@radix-ui/react-slot";
import { useLoginModal } from "@/components/auth/login-modal-context";

type LoginTriggerProps = {
  children: React.ReactNode;
  asChild?: boolean;
  callbackUrl?: string;
  className?: string;
};

/** 로그인 링크 대신 앱 스타일 로그인 모달을 연다 */
export function LoginTrigger({
  children,
  asChild = true,
  callbackUrl,
  className,
}: LoginTriggerProps) {
  const { openLogin } = useLoginModal();
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      type={asChild ? undefined : "button"}
      className={className}
      onClick={(e: React.MouseEvent) => {
        e.preventDefault();
        openLogin(callbackUrl);
      }}
    >
      {children}
    </Comp>
  );
}
