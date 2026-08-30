import { prisma } from '@/core/database/prisma'
import { defaultWebConfig } from './default-config'

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
  },

  async getMergedWebConfig() {
    const configs = await this.getAllWebConfigs()
    // Deep clone to avoid mutating the exported default config object
    const merged = JSON.parse(JSON.stringify(defaultWebConfig)) as typeof defaultWebConfig & Record<string, unknown>

    for (const config of configs) {
      try {
        const parsed: unknown = JSON.parse(config.valueJson)
        const currentValue = merged[config.key]
        if (
          currentValue &&
          typeof currentValue === 'object' &&
          !Array.isArray(currentValue) &&
          parsed &&
          typeof parsed === 'object' &&
          !Array.isArray(parsed)
        ) {
          merged[config.key] = {
            ...(currentValue as Record<string, unknown>),
            ...(parsed as Record<string, unknown>),
          }
        } else {
          merged[config.key] = parsed
        }
      } catch {
        // skip invalid JSON
      }
    }

    return merged
  }
}
