"use client";

import { useEffect } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useSession } from "next-auth/react";
import { X } from "lucide-react";
import { QuickLoginPanel } from "@/components/auth/quick-login-panel";
import { safeCallbackPath } from "@/lib/auth/safe-callback-url";
import { cn } from "@/lib/utils";

type LoginModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  callbackUrl: string;
  onSuccess?: () => void;
};

export function LoginModal({
  open,
  onOpenChange,
  callbackUrl,
  onSuccess,
}: LoginModalProps) {
  const { status } = useSession();
  const safeCallback = safeCallbackPath(callbackUrl);

  useEffect(() => {
    if (status === "authenticated" && open) {
      onOpenChange(false);
      onSuccess?.();
    }
  }, [status, open, onOpenChange, onSuccess]);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className={cn(
            "fixed inset-0 z-[100] bg-black/40 backdrop-blur-md",
            "supports-[backdrop-filter]:bg-black/25",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
          )}
        />
        <DialogPrimitive.Content
          className={cn(
            "fixed inset-x-0 bottom-0 z-[101] mx-auto flex max-h-[92dvh] w-full max-w-md flex-col rounded-t-2xl border border-white/60 bg-surface/95 shadow-2xl outline-none backdrop-blur-xl supports-[backdrop-filter]:bg-surface/90",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom duration-300",
            "pb-[max(1rem,env(safe-area-inset-bottom))]"
          )}
          aria-describedby={undefined}
        >
          <div className="flex shrink-0 justify-center pt-2.5">
            <span className="h-1 w-10 rounded-full bg-[#e5e7eb]" aria-hidden />
          </div>

          <div className="flex items-start justify-between px-4 pt-2">
            <div>
              <DialogPrimitive.Title className="text-lg font-bold text-foreground">
                로그인
              </DialogPrimitive.Title>
              <DialogPrimitive.Description className="mt-0.5 text-sm text-muted-foreground">
                구글 또는 이메일로 로그인하세요
              </DialogPrimitive.Description>
            </div>
            <DialogPrimitive.Close
              className="focus-ring rounded-lg p-1.5 text-muted-foreground hover:bg-secondary"
              aria-label="닫기"
            >
              <X className="h-5 w-5" />
            </DialogPrimitive.Close>
          </div>

          <div className="flex-1 overflow-y-auto px-4 pb-4 pt-3">
            {open && (
              <QuickLoginPanel
                callbackUrl={safeCallback}
                onClose={() => onOpenChange(false)}
                onSuccess={onSuccess}
              />
            )}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
