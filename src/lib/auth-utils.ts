import { auth } from "@/auth";
import type { Session } from "next-auth";
import { redirect } from "next/navigation";

const buildStubSession: Session = {
  user: {
    id: "build",
    email: "build@hokei.local",
    name: "Build",
    role: "ADMIN",
  },
  expires: new Date(Date.now() + 86_400_000).toISOString(),
};

function isProductionBuildPhase(): boolean {
  return process.env.NEXT_PHASE === "phase-production-build";
}

export async function requireAuth() {
  if (isProductionBuildPhase()) {
    return buildStubSession;
  }
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  return session;
}

export async function requireAdmin() {
  const session = await requireAuth();
  if (session.user.role !== "ADMIN") {
    redirect("/");
  }
  return session;
}
