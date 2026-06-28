"use client";

import { SessionProvider } from "next-auth/react";
import { AUTH_SESSION_UPDATE_AGE_SEC } from "@/lib/auth/session-config";

export function AuthSessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider refetchInterval={AUTH_SESSION_UPDATE_AGE_SEC}>
      {children}
    </SessionProvider>
  );
}
