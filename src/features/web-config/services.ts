import { can } from '@/core/authorization/rbac'
import { ForbiddenError, NotFoundError } from '@/core/errors/custom-errors'
import { webConfigSchema, WebConfigInput } from './schemas'
import { prisma } from '@/core/database/prisma'
import { webConfigQueries } from './queries'

export const webConfigService = {
  async upsertWebConfig(input: WebConfigInput, userId: string) {
    const validated = webConfigSchema.parse(input)
    
    const userObj = await prisma.user.findUnique({ where: { id: userId }, include: { role: true } })
    if (!userObj) throw new NotFoundError('User tidak ditemukan')

    if (!(await can('web.manage', userObj)) && userObj.role.name !== 'Super Admin') {
      throw new ForbiddenError('Tidak memiliki izin untuk mengelola konfigurasi web')
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
