import { prisma } from '@/core/database/prisma'

export const auditQueries = {
  async getAuditLogs(skip = 0, take = 20, entity?: string) {
    return prisma.auditLog.findMany({
      where: entity ? { entity } : undefined,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { name: true, email: true } } }
    })
  },
  async getAuditLogsCount(entity?: string) {
    return prisma.auditLog.count({
      where: entity ? { entity } : undefined
    })
  },
  async getEntityHistory(entity: string, entityId: string) {
    return prisma.auditLog.findMany({
      where: { entity, entityId },
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { name: true, roleId: true } } }
    })
  }
}
