"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import { LoginModal } from "@/components/auth/login-modal";

type LoginModalContextValue = {
  open: boolean;
  openLogin: (callbackUrl?: string) => void;
  closeLogin: () => void;
  callbackUrl: string;
};

const LoginModalContext = createContext<LoginModalContextValue | null>(null);

export function LoginModalProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [callbackUrl, setCallbackUrl] = useState("/");

  const openLogin = useCallback(
    (url?: string) => {
      setCallbackUrl(url ?? pathname ?? "/");
      setOpen(true);
    },
    [pathname]
  );

  const closeLogin = useCallback(() => setOpen(false), []);

  const value = useMemo(
    () => ({ open, openLogin, closeLogin, callbackUrl }),
    [open, openLogin, closeLogin, callbackUrl]
  );

  return (
    <LoginModalContext.Provider value={value}>
      {children}
      <LoginModal
        open={open}
        onOpenChange={setOpen}
        callbackUrl={callbackUrl}
        onSuccess={closeLogin}
      />
    </LoginModalContext.Provider>
  );
}

export function useLoginModal(): LoginModalContextValue {
  const ctx = useContext(LoginModalContext);
  if (!ctx) {
    throw new Error("useLoginModal must be used within LoginModalProvider");
  }
  return ctx;
}
