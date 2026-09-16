import { prisma } from '@/core/database/prisma'
import { defaultWebConfig } from './default-config'
import { emptyPublicContactInfo, normalizePublicContactInfo, type PublicContactInfo } from './contact-contract'
import { normalizeAboutContent, normalizeHomepageContent, type AboutContentInput, type HomepageContentInput } from './content-contract'

export type { PublicContactInfo } from './contact-contract'

function parsePublicContactInfo(valueJson: string): PublicContactInfo {
  try {
    return normalizePublicContactInfo(JSON.parse(valueJson) as unknown)
  } catch {
    return emptyPublicContactInfo
  }
}

function parseJsonValue(valueJson: string | undefined): unknown {
  if (!valueJson) return undefined
  try {
    return JSON.parse(valueJson) as unknown
  } catch {
    return undefined
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
    return config ? parsePublicContactInfo(config.valueJson) : normalizePublicContactInfo(defaultWebConfig.contact_info)
  },

  async getPublicHomepageContent(): Promise<HomepageContentInput> {
    const [hero, profile, cta] = await Promise.all([
      this.getWebConfigByKey('landing_hero'),
      this.getWebConfigByKey('landing_about'),
      this.getWebConfigByKey('landing_cta'),
    ])
    return normalizeHomepageContent({
      landing_hero: parseJsonValue(hero?.valueJson),
      landing_about: parseJsonValue(profile?.valueJson),
      landing_cta: parseJsonValue(cta?.valueJson),
    })
  },

  async getPublicAboutContent(): Promise<AboutContentInput> {
    const config = await this.getWebConfigByKey('about_page')
    return normalizeAboutContent(parseJsonValue(config?.valueJson))
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
