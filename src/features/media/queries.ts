import { prisma } from '@/core/database/prisma'

export const mediaQueries = {
  async getMediaAssets(search?: string) {
    return prisma.mediaAsset.findMany({
      where: {
        deletedAt: null,
        ...(search ? {
          OR: [
            { filename: { contains: search, mode: 'insensitive' as const } },
            { mimeType: { contains: search, mode: 'insensitive' as const } },
          ],
        } : {}),
      },
      include: {
        uploader: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 48,
    })
  },

  async getMediaAssetById(id: string) {
    return prisma.mediaAsset.findFirst({
      where: { id, deletedAt: null },
    })
  },
}
