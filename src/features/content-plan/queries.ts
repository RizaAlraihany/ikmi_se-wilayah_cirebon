import { ContentPlanStatus, type Prisma } from '@prisma/client'
import { KOMDIGI_DASHBOARD_ROLE_IDS } from '@/core/auth/roles'
import { prisma } from '@/core/database/prisma'
import { requireContentPlanActor } from './access'
import {
  CONTENT_PLATFORMS,
  CONTENT_PLAN_STATUSES,
  CONTENT_TYPES,
  contentPlanMonthRange,
  normalizeContentPlanMonth,
} from './domain'

export type ContentPlanFilters = {
  month?: string
  platform?: string
  contentType?: string
  authorId?: string
  status?: string
  programId?: string
  agendaId?: string
}

export function normalizeContentPlanFilters(filters: ContentPlanFilters = {}, now = new Date()) {
  const safeId = (value: string | undefined) => value && value.length <= 80 ? value : undefined
  return {
    month: normalizeContentPlanMonth(filters.month, now),
    platform: CONTENT_PLATFORMS.includes(filters.platform as (typeof CONTENT_PLATFORMS)[number]) ? filters.platform : undefined,
    contentType: CONTENT_TYPES.includes(filters.contentType as (typeof CONTENT_TYPES)[number]) ? filters.contentType : undefined,
    authorId: safeId(filters.authorId),
    status: CONTENT_PLAN_STATUSES.includes(filters.status as (typeof CONTENT_PLAN_STATUSES)[number]) ? filters.status as ContentPlanStatus : undefined,
    programId: safeId(filters.programId),
    agendaId: safeId(filters.agendaId),
  }
}

function planWhere(filters: ReturnType<typeof normalizeContentPlanFilters>): Prisma.ContentPlanWhereInput {
  const range = contentPlanMonthRange(filters.month)
  return {
    deletedAt: null,
    publishDate: { gte: range.start, lt: range.end },
    ...(filters.platform ? { platform: filters.platform } : {}),
    ...(filters.contentType ? { contentType: filters.contentType } : {}),
    ...(filters.authorId ? { authorId: filters.authorId } : {}),
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.programId ? { programId: filters.programId } : {}),
    ...(filters.agendaId ? { agendaId: filters.agendaId } : {}),
  }
}

const planInclude = {
  author: { select: { id: true, name: true } },
  program: { select: { id: true, name: true } },
  agenda: { select: { id: true, name: true } },
  pamfletRequest: { select: { requestNumber: true, deadline: true } },
} satisfies Prisma.ContentPlanInclude

export const contentPlanQueries = {
  async getPlans(filters: ContentPlanFilters = {}) {
    await requireContentPlanActor()
    const normalized = normalizeContentPlanFilters(filters)
    return prisma.contentPlan.findMany({
      where: planWhere(normalized),
      include: planInclude,
      orderBy: [{ publishDate: 'asc' }, { title: 'asc' }],
    })
  },

  async getPlanById(id: string) {
    await requireContentPlanActor()
    return prisma.contentPlan.findFirst({ where: { id, deletedAt: null }, include: planInclude })
  },

  async getStatusCounts() {
    await requireContentPlanActor()
    return prisma.contentPlan.groupBy({
      by: ['status'],
      where: { deletedAt: null },
      _count: { id: true },
    })
  },

  async getWorkspace(filters: ContentPlanFilters = {}) {
    await requireContentPlanActor()
    const normalized = normalizeContentPlanFilters(filters)
    const [plans, authors, programs, agendas] = await Promise.all([
      prisma.contentPlan.findMany({
        where: planWhere(normalized),
        include: planInclude,
        orderBy: [{ publishDate: 'asc' }, { title: 'asc' }],
      }),
      prisma.user.findMany({
        where: { deletedAt: null, isActive: true, roleId: { in: [...KOMDIGI_DASHBOARD_ROLE_IDS] } },
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      }),
      prisma.program.findMany({
        where: { deletedAt: null },
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      }),
      prisma.agenda.findMany({
        where: { deletedAt: null },
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      }),
    ])
    return { filters: normalized, plans, authors, programs, agendas }
  },

  statuses: [...CONTENT_PLAN_STATUSES] as ContentPlanStatus[],
}
