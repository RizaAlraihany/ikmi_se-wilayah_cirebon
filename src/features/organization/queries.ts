import { prisma } from '@/core/database/prisma'
import { requireOrganizationAccess } from './access'
import { cabinetConfigKey, cabinetSchema } from './cabinet'

export const organizationQueries = {
  async getPeriodSettings() {
    await requireOrganizationAccess('organization.update')

    const activePeriod = await prisma.period.findFirst({
      where: { status: 'ACTIVE', deletedAt: null },
      orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
    })

    const history = await prisma.period.findMany({
      where: { deletedAt: null, status: { not: 'ACTIVE' } },
      select: { id: true, name: true, status: true, startDate: true, endDate: true, updatedAt: true },
      orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
      take: 8,
    })

    if (!activePeriod) return { activePeriod: null, history, setup: null }

    const [agendaCount, programCount, scheduledProgramCount, structureCount, bannerCount, cabinetConfig] = await Promise.all([
      prisma.agenda.count({ where: { periodId: activePeriod.id, deletedAt: null } }),
      prisma.program.count({ where: { periodId: activePeriod.id, deletedAt: null } }),
      prisma.program.count({ where: { periodId: activePeriod.id, deletedAt: null, plannedStart: { not: null }, plannedEnd: { not: null } } }),
      prisma.structureAssignment.count({ where: { periodId: activePeriod.id, deletedAt: null } }),
      prisma.homepageBanner.count({ where: { deletedAt: null, program: { is: { periodId: activePeriod.id, deletedAt: null } } } }),
      prisma.webConfig.findFirst({ where: { key: cabinetConfigKey(activePeriod.id), deletedAt: null }, select: { valueJson: true } }),
    ])

    let cabinet: ReturnType<typeof cabinetSchema.safeParse>['data'] | null = null
    try {
      const parsed = cabinetConfig ? cabinetSchema.safeParse(JSON.parse(cabinetConfig.valueJson)) : null
      cabinet = parsed?.success ? parsed.data : null
    } catch {
      cabinet = null
    }

    return {
      activePeriod,
      history,
      setup: {
        cabinetReady: Boolean(cabinet && (activePeriod.cabinetName || cabinet.description || cabinet.tagline)),
        visionMissionReady: Boolean(cabinet?.vision && cabinet.missions.length),
        structureCount,
        programCount,
        scheduledProgramCount,
        agendaCount,
        bannerCount,
      },
    }
  },

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
