import { AuditAction, Prisma } from '@prisma/client'
import { isSuperAdminRole } from '@/core/auth/roles'
import { requirePermission } from '@/core/authorization/guards'
import { prisma } from '@/core/database/prisma'
import { ForbiddenError } from '@/core/errors/custom-errors'
import { parseAuditData } from './audit-data'

export const AUDIT_PAGE_SIZE = 20

export interface AuditLogFilters {
  page: number
  userId?: string
  action?: AuditAction
  entity?: string
  dateFrom?: Date
  dateToExclusive?: Date
}

async function requireAuditViewer() {
  const actor = await requirePermission('audit.view')
  if (!isSuperAdminRole(actor.roleId)) {
    throw new ForbiddenError('Hanya Super Admin yang dapat melihat audit log.')
  }
  return actor
}

function buildWhere(filters: AuditLogFilters): Prisma.AuditLogWhereInput {
  return {
    ...(filters.userId ? { userId: filters.userId } : {}),
    ...(filters.action ? { action: filters.action } : {}),
    ...(filters.entity ? { entity: filters.entity } : {}),
    ...(filters.dateFrom || filters.dateToExclusive
      ? {
          createdAt: {
            ...(filters.dateFrom ? { gte: filters.dateFrom } : {}),
            ...(filters.dateToExclusive ? { lt: filters.dateToExclusive } : {}),
          },
        }
      : {}),
  }
}

export const auditQueries = {
  async getAuditLogPage(filters: AuditLogFilters) {
    await requireAuditViewer()

    const where = buildWhere(filters)
    const totalItems = await prisma.auditLog.count({ where })
    const totalPages = Math.max(1, Math.ceil(totalItems / AUDIT_PAGE_SIZE))
    const page = Math.min(totalPages, Math.max(1, Math.trunc(filters.page)))
    const [rows, actorRows, entityRows] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip: (page - 1) * AUDIT_PAGE_SIZE,
        take: AUDIT_PAGE_SIZE,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        select: {
          id: true,
          action: true,
          entity: true,
          entityId: true,
          oldData: true,
          newData: true,
          createdAt: true,
          user: { select: { id: true, name: true } },
        },
      }),
      prisma.auditLog.findMany({
        where: { userId: { not: null }, user: { isNot: null } },
        distinct: ['userId'],
        orderBy: { userId: 'asc' },
        select: { user: { select: { id: true, name: true } } },
      }),
      prisma.auditLog.findMany({
        distinct: ['entity'],
        orderBy: { entity: 'asc' },
        select: { entity: true },
      }),
    ])

    return {
      page,
      totalItems,
      totalPages,
      logs: rows.map((row) => ({
        ...row,
        oldData: parseAuditData(row.oldData),
        newData: parseAuditData(row.newData),
      })),
      actors: actorRows.flatMap((row) => (row.user ? [row.user] : [])),
      entities: entityRows.map((row) => row.entity),
    }
  },

  async getEntityHistory(entity: string, entityId: string) {
    await requireAuditViewer()
    const rows = await prisma.auditLog.findMany({
      where: { entity, entityId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        action: true,
        entity: true,
        entityId: true,
        oldData: true,
        newData: true,
        createdAt: true,
        user: { select: { id: true, name: true } },
      },
    })

    return rows.map((row) => ({
      ...row,
      oldData: parseAuditData(row.oldData),
      newData: parseAuditData(row.newData),
    }))
  },
}
