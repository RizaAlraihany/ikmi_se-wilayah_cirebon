import { prisma } from '@/core/database/prisma'
import { defaultWebConfig } from './default-config'

export type PublicContactInfo = {
  email: string | null
  whatsapp: string | null
  address: string | null
  instagram: string | null
  tiktok: string | null
  youtube: string | null
}

const emptyPublicContactInfo: PublicContactInfo = {
  email: null,
  whatsapp: null,
  address: null,
  instagram: null,
  tiktok: null,
  youtube: null,
}

function readContactValue(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function parsePublicContactInfo(valueJson: string): PublicContactInfo {
  try {
    const parsed: unknown = JSON.parse(valueJson)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return emptyPublicContactInfo

    const contact = parsed as Record<string, unknown>
    return {
      email: readContactValue(contact.email),
      whatsapp: readContactValue(contact.whatsapp),
      address: readContactValue(contact.address),
      instagram: readContactValue(contact.instagram),
      tiktok: readContactValue(contact.tiktok),
      youtube: readContactValue(contact.youtube),
    }
  } catch {
    return emptyPublicContactInfo
  }
}

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

  async getPublicContactInfo(): Promise<PublicContactInfo> {
    const config = await this.getWebConfigByKey('contact_info')
    return config ? parsePublicContactInfo(config.valueJson) : emptyPublicContactInfo
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
