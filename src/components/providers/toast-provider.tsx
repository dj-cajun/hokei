"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastType = "success" | "error";

type ToastState = {
  message: string;
  type: ToastType;
  id: number;
} | null;

type ToastContextValue = {
  showToast: (message: string, type?: ToastType) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const AUTO_DISMISS_MS = 3200;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState>(null);
  const [exiting, setExiting] = useState(false);

  const dismiss = useCallback(() => {
    setExiting(true);
    window.setTimeout(() => {
      setToast(null);
      setExiting(false);
    }, 250);
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = "success") => {
      setExiting(false);
      setToast({ message, type, id: Date.now() });
    },
    []
  );

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(dismiss, AUTO_DISMISS_MS);
    return () => window.clearTimeout(t);
  }, [toast, dismiss]);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="pointer-events-none fixed inset-x-0 bottom-20 z-[90] flex justify-center px-4 lg:bottom-6"
        >
          <p
            className={cn(
              "flex max-w-[min(100%,360px)] items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium shadow-lg",
              exiting ? "animate-fade-out" : "animate-slide-up",
              toast.type === "success"
                ? "bg-[#0f172a] text-white dark:bg-surface dark:text-foreground"
                : "bg-red-600 text-white"
            )}
          >
            {toast.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden />
            ) : (
              <XCircle className="h-4 w-4 shrink-0" aria-hidden />
            )}
            <span>{toast.message}</span>
          </p>
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return ctx;
}
