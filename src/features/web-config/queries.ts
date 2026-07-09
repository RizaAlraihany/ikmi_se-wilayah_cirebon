import { prisma } from '@/core/database/prisma'

export const webConfigQueries = {
  async getAllWebConfigs() {
    return prisma.webConfig.findMany({
      where: { deletedAt: null },
      orderBy: { key: 'asc' }
    })
  },

  async getWebConfigByKey(key: string) {
    return prisma.webConfig.findFirst({
      where: { key, deletedAt: null }
    })
  }
}
