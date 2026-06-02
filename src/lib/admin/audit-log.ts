import { getClientIp } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";

export type AuditParams = {
  actorId: string;
  action: string;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
  request?: Request;
};

export async function writeAdminAudit(params: AuditParams): Promise<void> {
  const ip = params.request ? getClientIp(params.request) : undefined;
  await prisma.adminAuditLog.create({
    data: {
      actorId: params.actorId,
      action: params.action,
      targetType: params.targetType ?? null,
      targetId: params.targetId ?? null,
      metadata: params.metadata ? JSON.stringify(params.metadata) : null,
      ip: ip ?? null,
    },
  });
}
