import { prisma } from '@/core/database/prisma'

export const userQueries = {
  async getPaginatedUsers(page: number = 1, limit: number = 10, search?: string) {
    const skip = (page - 1) * limit

    const where = {
      deletedAt: null,
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { email: { contains: search, mode: 'insensitive' as const } },
        ]
      })
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          role: true,
          department: true,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.count({ where })
    ])

    return {
      data: users,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    }
  },

  async getUserById(id: string) {
    return prisma.user.findFirst({
      where: { id, deletedAt: null },
      include: { role: true, department: true }
    })
  },

  async getAuthorOptions() {
    return prisma.user.findMany({
      where: {
        deletedAt: null,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        department: {
          select: {
            name: true,
          },
        },
        role: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    })
  },

  async getRoles() {
    return prisma.role.findMany({ orderBy: { name: 'asc' } })
  },

  async getDepartments() {
    return prisma.department.findMany({ orderBy: { name: 'asc' } })
  }
}
