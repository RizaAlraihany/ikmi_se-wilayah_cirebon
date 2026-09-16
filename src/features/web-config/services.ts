import { contactInfoSchema, type ContactInfoInput } from './schemas'
import { prisma } from '@/core/database/prisma'
import { webConfigQueries } from './queries'
import { serializeAuditData } from '@/features/audit/audit-data'
import { requireRoleForUser, type ActiveSessionUser } from '@/core/authorization/guards'
import { KOMDIGI_DASHBOARD_ROLE_IDS, ORGANIZATION_DASHBOARD_ROLE_IDS } from '@/core/auth/roles'
import { CONTACT_CONFIG_KEY } from './contact-contract'
import { aboutContentSchema, homepageContentSchema, type AboutContentInput, type HomepageContentInput } from './content-contract'

function parseObject(valueJson: string | undefined): Record<string, unknown> {
  if (!valueJson) return {}
  try {
    const value: unknown = JSON.parse(valueJson)
    return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
  } catch {
    return {}
  }
}

export const webConfigService = {
  async updateContactInfo(input: ContactInfoInput, actor: ActiveSessionUser) {
    const validated = contactInfoSchema.parse(input)
    const allowedActor = await requireRoleForUser(actor, ORGANIZATION_DASHBOARD_ROLE_IDS)
    const valueJson = JSON.stringify({
      email: validated.email,
      whatsapp: validated.whatsapp,
      address: validated.address,
      instagram: validated.instagram,
      tiktok: validated.tiktok,
      youtube: validated.youtube,
    })
    const existing = await webConfigQueries.getWebConfigByKey(CONTACT_CONFIG_KEY)

    const [config] = await prisma.$transaction([
      prisma.webConfig.upsert({
        where: { key: CONTACT_CONFIG_KEY },
        update: { valueJson, deletedAt: null },
        create: {
          key: CONTACT_CONFIG_KEY,
          valueJson,
        }
      }),
      prisma.auditLog.create({
        data: {
          action: 'SECURITY_SETTING_CHANGE',
          entity: 'WebConfig',
          entityId: CONTACT_CONFIG_KEY,
          oldData: existing ? serializeAuditData(existing.valueJson) : null,
          newData: serializeAuditData(valueJson),
          userId: allowedActor.id,
        }
      })
    ])

    return config
  },

  async updateHomepageContent(input: HomepageContentInput, actor: ActiveSessionUser) {
    const validated = homepageContentSchema.parse(input)
    const allowedActor = await requireRoleForUser(actor, KOMDIGI_DASHBOARD_ROLE_IDS)
    const keys = ['landing_hero', 'landing_about', 'landing_cta'] as const
    const existing = await Promise.all(keys.map((key) => webConfigQueries.getWebConfigByKey(key)))
    const valueByKey = {
      landing_hero: JSON.stringify({ ...parseObject(existing[0]?.valueJson), ...validated.hero }),
      landing_about: JSON.stringify({ ...parseObject(existing[1]?.valueJson), ...validated.profile }),
      landing_cta: JSON.stringify({ ...parseObject(existing[2]?.valueJson), ...validated.cta }),
    }

    await prisma.$transaction([
      ...keys.map((key) => prisma.webConfig.upsert({
        where: { key },
        update: { valueJson: valueByKey[key], deletedAt: null },
        create: { key, valueJson: valueByKey[key] },
      })),
      prisma.auditLog.create({
        data: {
          action: 'SECURITY_SETTING_CHANGE',
          entity: 'WebConfig',
          entityId: 'homepage_editorial',
          oldData: serializeAuditData(Object.fromEntries(keys.map((key, index) => [key, existing[index]?.valueJson ?? null]))),
          newData: serializeAuditData(valueByKey),
          userId: allowedActor.id,
        },
      }),
    ])
  },

  async updateAboutContent(input: AboutContentInput, actor: ActiveSessionUser) {
    const validated = aboutContentSchema.parse(input)
    const allowedActor = await requireRoleForUser(actor, ORGANIZATION_DASHBOARD_ROLE_IDS)
    const existing = await webConfigQueries.getWebConfigByKey('about_page')
    const valueJson = JSON.stringify({ ...parseObject(existing?.valueJson), ...validated })

    await prisma.$transaction([
      prisma.webConfig.upsert({
        where: { key: 'about_page' },
        update: { valueJson, deletedAt: null },
        create: { key: 'about_page', valueJson },
      }),
      prisma.auditLog.create({
        data: {
          action: 'SECURITY_SETTING_CHANGE',
          entity: 'WebConfig',
          entityId: 'about_page',
          oldData: existing ? serializeAuditData(existing.valueJson) : null,
          newData: serializeAuditData(valueJson),
          userId: allowedActor.id,
        },
      }),
    ])
  },
}
