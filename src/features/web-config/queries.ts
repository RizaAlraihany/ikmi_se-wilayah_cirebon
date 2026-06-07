import { prisma } from '@/core/database/prisma'

export const webConfigQueries = {
  async getAllWebConfigs() {
    return prisma.webConfig.findMany({
      orderBy: { key: 'asc' }
    })
  },

  async getWebConfigByKey(key: string) {
    return prisma.webConfig.findUnique({
      where: { key }
    })
  }
}
