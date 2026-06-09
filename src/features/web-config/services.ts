import { ValidationError } from '@/core/errors/custom-errors'
import { webConfigSchema, WebConfigInput } from './schemas'
import { prisma } from '@/core/database/prisma'
import { webConfigQueries } from './queries'
import { requireCmsUpdate } from '@/features/cms/access'

export const webConfigService = {
  async upsertWebConfig(input: WebConfigInput, userId: string) {
    const validated = webConfigSchema.parse(input)
    await requireCmsUpdate(userId)

    try {
      JSON.parse(validated.valueJson)
    } catch {
      throw new ValidationError('Value konfigurasi harus berupa JSON valid')
    }

    const existing = await webConfigQueries.getWebConfigByKey(validated.key)

    const [config] = await prisma.$transaction([
      prisma.webConfig.upsert({
        where: { key: validated.key },
        update: { valueJson: validated.valueJson },
        create: {
          key: validated.key,
          valueJson: validated.valueJson
        }
      }),
      prisma.auditLog.create({
        data: {
          action: existing ? 'UPDATE' : 'CREATE',
          entity: 'WebConfig',
          entityId: validated.key,
          oldData: existing ? existing.valueJson : null,
          newData: validated.valueJson,
          userId,
        }
      })
    ])

    return config
  }
}
