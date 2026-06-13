import { prisma } from '@/core/database/prisma'

export const managementQueries = {
  /**
   * Ambil semua pengurus (user yang memiliki positionId atau departmentId).
   * Ini mencakup BPH dan semua departemen — aktif maupun demisioner.
   */
  async getPengurus(skip = 0, take = 50) {
    return prisma.user.findMany({
      where: {
        deletedAt: null,
        OR: [
          { positionId: { not: null } },
          { departmentId: { not: null } },
        ],
      },
      include: {
        role: true,
        department: true,
        position: true,
      },
      orderBy: [
        { department: { code: 'asc' } },
        { name: 'asc' },
      ],
      skip,
      take,
    })
  },

  async getPengurusById(id: string) {
    return prisma.user.findUnique({
      where: { id, deletedAt: null },
      include: {
        role: true,
        department: true,
        position: true,
      },
    })
  },

  async getDepartments() {
    return prisma.department.findMany({
      where: { deletedAt: null },
      include: { positions: { where: { deletedAt: null } } },
      orderBy: { name: 'asc' },
    })
  },

  async getPositions(departmentId?: string) {
    return prisma.position.findMany({
      where: {
        deletedAt: null,
        ...(departmentId ? { departmentId } : {}),
      },
      orderBy: { name: 'asc' },
    })
  },

  async countPengurus() {
    return prisma.user.count({
      where: {
        deletedAt: null,
        OR: [
          { positionId: { not: null } },
          { departmentId: { not: null } },
        ],
      },
    })
  },
}
