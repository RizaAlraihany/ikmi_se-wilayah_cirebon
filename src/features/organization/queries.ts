import { prisma } from '@/core/database/prisma'
import { requireOrganizationAccess } from './access'
import { cabinetConfigKey, cabinetSchema } from './cabinet'

export const organizationQueries = {
  async getOverview() {
    await requireOrganizationAccess('organization.view')
    const [periods, units, members] = await Promise.all([
      prisma.period.findMany({
        where: { deletedAt: null },
        orderBy: [{ status: 'asc' }, { name: 'asc' }],
      }),
      prisma.department.findMany({
        where: { deletedAt: null },
        include: {
          headMember: { select: { id: true, fullName: true } },
          positions: { where: { deletedAt: null }, orderBy: { name: 'asc' } },
          _count: { select: { users: true, programs: true, agendas: true } },
        },
        orderBy: { name: 'asc' },
      }),
      prisma.member.findMany({
        where: { deletedAt: null },
        select: { id: true, fullName: true, membershipStatus: true },
        orderBy: { fullName: 'asc' },
      }),
    ])

    const configs = await prisma.webConfig.findMany({ where: { key: { in: periods.map((period) => cabinetConfigKey(period.id)) }, deletedAt: null }, select: { key: true, valueJson: true } })
    return { periods: periods.map((period) => {
      const config = configs.find((entry) => entry.key === cabinetConfigKey(period.id))
      try {
        const cabinet = config ? cabinetSchema.safeParse(JSON.parse(config.valueJson)) : null
        return { ...period, cabinet: cabinet?.success ? cabinet.data : null }
      } catch {
        return { ...period, cabinet: null }
      }
    }), units, members }
  },
}
