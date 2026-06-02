import { prisma } from "@/lib/prisma";

export async function computeAttachmentStats(): Promise<{
  attachmentBytes: number;
  attachmentCount: number;
}> {
  const agg = await prisma.postAttachment.aggregate({
    _sum: { size: true },
    _count: true,
  });
  return {
    attachmentBytes: agg._sum.size ?? 0,
    attachmentCount: agg._count,
  };
}

export async function recordStorageSnapshot(blobEstimateBytes?: number | null) {
  const stats = await computeAttachmentStats();
  return prisma.storageSnapshot.create({
    data: {
      attachmentBytes: stats.attachmentBytes,
      attachmentCount: stats.attachmentCount,
      blobEstimateBytes: blobEstimateBytes ?? null,
    },
  });
}

export async function getRecentStorageSnapshots(limit = 30) {
  return prisma.storageSnapshot.findMany({
    orderBy: { takenAt: "desc" },
    take: limit,
  });
}
