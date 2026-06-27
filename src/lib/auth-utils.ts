import { auth } from "@/auth";
import type { Session } from "next-auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

const buildStubSession: Session = {
  user: {
    id: "build",
    email: "build@hokei.local",
    name: "Build",
    role: "ADMIN",
    isSuspended: false,
    writeBanned: false,
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

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isSuspended: true, writeBanned: true },
  });
  if (dbUser?.isSuspended) {
    redirect("/login?suspended=1");
  }
  if (dbUser) {
    session.user.writeBanned = dbUser.writeBanned;
  }

  return session;
}

export async function requireAdmin() {
  const session = await requireAuth();
  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (dbUser?.role !== "ADMIN") {
    redirect("/?adminDenied=1");
  }
  if (dbUser && session.user.role !== dbUser.role) {
    session.user.role = dbUser.role;
  }
  return session;
}
