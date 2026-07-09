import { prisma } from '@/core/database/prisma'

export const eventQueries = {
  async getEvents(programId?: string, skip = 0, take = 10) {
    return prisma.event.findMany({
      where: {
        deletedAt: null,
        status: { not: 'CANCELLED' },
        ...(programId ? { programId } : {}),
      },
      skip,
      take,
      include: { program: true },
      orderBy: { startDate: 'asc' }
    })
  },

  async getEventById(id: string) {
    return prisma.event.findFirst({
      where: { id, deletedAt: null, status: { not: 'CANCELLED' } },
      include: { program: true, report: true }
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
          gte: new Date(new Date(tomorrow).setHours(0, 0, 0, 0)),
          lte: new Date(new Date(tomorrow).setHours(23, 59, 59, 999))
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
  },

  /**
   * Ambil semua event yang sudah melewati endDate tapi statusnya masih aktif.
   * Digunakan oleh cron job untuk auto-complete ke COMPLETED.
   */
  async getExpiredActiveEvents(now: Date) {
    return prisma.event.findMany({
      where: {
        deletedAt: null,
        endDate: { lt: now },
        status: { in: ['UPCOMING', 'ONGOING'] },
      },
      select: { id: true, title: true, programId: true },
    })
  },

  /**
   * Ambil semua event yang sudah dimulai tapi belum melewati endDate,
   * dan statusnya masih UPCOMING. Digunakan untuk auto set ke ONGOING.
   */
  async getOngoingActiveEvents(now: Date) {
    return prisma.event.findMany({
      where: {
        deletedAt: null,
        startDate: { lte: now },
        endDate: { gte: now },
        status: 'UPCOMING',
      },
      select: { id: true, title: true, programId: true },
    })
  },
}
