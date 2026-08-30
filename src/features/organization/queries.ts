import { prisma } from '@/core/database/prisma'

export const organizationQueries = {
  async getOverview() {
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

    return { periods, units, members }
  },
}
