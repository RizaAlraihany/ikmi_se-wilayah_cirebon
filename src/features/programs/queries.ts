import prisma from '@/lib/prisma'
import { auth } from '@/core/auth/auth'
import type { Prisma } from '@prisma/client'

export const programQueries = {
  async getPrograms(departmentId?: string) {
    const session = await auth()
    if (!session?.user) return []

    const where: Prisma.ProgramWhereInput = { deletedAt: null }
    if (departmentId) {
      where.departmentId = departmentId
    } else {
      if (session.user.roleId !== 'super_admin') {
        if (!session.user.departmentId) return []
        where.departmentId = session.user.departmentId
      }
    }

    return prisma.program.findMany({
      where,
      include: {
        department: true,
        _count: {
          select: { events: true, activities: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
  },

  async getProgramById(id: string) {
    const session = await auth()
    if (!session?.user) return null

    const program = await prisma.program.findUnique({
      where: { id, deletedAt: null },
      include: {
        department: true,
        activities: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' }
        },
        events: {
          where: { deletedAt: null },
          orderBy: { startDate: 'desc' }
        }
      }
    })

    if (!program) return null

    if (session.user.roleId !== 'super_admin') {
      if (program.departmentId !== session.user.departmentId) return null
    }

    return program
  }
}
