import { prisma } from '@/core/database/prisma'

export const eventQueries = {
  async getEvents(programId?: string, skip = 0, take = 10) {
    return prisma.event.findMany({
      where: programId ? { programId } : undefined,
      skip,
      take,
      include: { program: true },
      orderBy: { startDate: 'asc' }
    })
  },

  async getEventById(id: string) {
    return prisma.event.findUnique({
      where: { id },
      include: { program: true }
    })
  },

  async getEventsWithoutReport(departmentId?: string) {
    return prisma.event.findMany({
      where: {
        program: departmentId ? { departmentId } : undefined,
        report: null
      },
      select: { id: true, title: true }
    })
  },

  async getUpcomingEventsForReminder(tomorrow: Date) {
    return prisma.event.findMany({
      where: {
        status: 'UPCOMING',
        startDate: {
          gte: new Date(new Date(tomorrow).setHours(0,0,0,0)),
          lte: new Date(new Date(tomorrow).setHours(23,59,59,999))
        }
      }
    })
  },

  async getOverdueEventsWithoutReport(sevenDaysAgo: Date) {
    return prisma.event.findMany({
      where: {
        status: 'COMPLETED',
        endDate: { lt: sevenDaysAgo },
        report: null
      }
    })
  }
}
