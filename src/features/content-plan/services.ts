import { ContentPlanStatus } from '@prisma/client'
import { prisma } from '@/core/database/prisma'
import { ValidationError, ForbiddenError, NotFoundError } from '@/core/errors/custom-errors'
import { contentPlanCreateSchema, contentPlanUpdateSchema, type ContentPlanCreateInput, type ContentPlanUpdateInput } from './schemas'
import { contentPlanQueries } from './queries'
import { isKomdigi, requireCmsUpdate, requirePermission } from '@/features/cms/access'
import { can, SessionUser } from '@/core/authorization/rbac'

export const contentPlanService = {
  async createPlan(input: ContentPlanCreateInput, userId: string) {
    const validated = contentPlanCreateSchema.parse(input)
    await requirePermission('content_plan.manage', userId)

    const author = await prisma.user.findFirst({
      where: { id: validated.authorId, deletedAt: null, isActive: true },
      include: { department: true },
    })
    if (!author) throw new ValidationError('Penulis tidak ditemukan.')

    const actor = await requirePermission('content_plan.manage', userId)
    const isGlobal = await can('system.manage', actor as SessionUser)
    if (!isGlobal && author.departmentId !== actor.departmentId) {
      throw new ForbiddenError('Content plan hanya dapat dibuat untuk departemen sendiri.')
    }

    const [plan] = await prisma.$transaction([
      prisma.contentPlan.create({
        data: {
          title: validated.title,
          platform: validated.platform,
          publishDate: validated.publishDate,
          status: validated.status,
          authorId: validated.authorId,
          createdBy: userId,
        },
      }),
      prisma.auditLog.create({
        data: {
          action: 'CREATE',
          entity: 'ContentPlan',
          entityId: 'PENDING',
          newData: JSON.stringify(validated),
          userId,
        },
      }),
    ])

    await prisma.auditLog.updateMany({
      where: { entity: 'ContentPlan', entityId: 'PENDING', userId },
      data: { entityId: plan.id },
    })

    return plan
  },

  async updatePlan(input: ContentPlanUpdateInput, userId: string) {
    const validated = contentPlanUpdateSchema.parse(input)
    const existing = await contentPlanQueries.getPlanById(validated.id)
    if (!existing) throw new NotFoundError('Content plan tidak ditemukan.')

    const actor = await requirePermission('content_plan.manage', userId)
    const isGlobal = await can('system.manage', actor as SessionUser)
    const canEdit = isGlobal || isKomdigi(actor) || existing.authorId === userId
    if (!canEdit) {
      throw new ForbiddenError('Tidak memiliki akses mengubah content plan ini.')
    }

    const [plan] = await prisma.$transaction([
      prisma.contentPlan.update({
        where: { id: validated.id },
        data: {
          title: validated.title,
          platform: validated.platform,
          publishDate: validated.publishDate,
          status: validated.status,
          authorId: validated.authorId,
          updatedBy: userId,
        },
      }),
      prisma.auditLog.create({
        data: {
          action: 'UPDATE',
          entity: 'ContentPlan',
          entityId: validated.id,
          oldData: JSON.stringify(existing),
          newData: JSON.stringify(validated),
          userId,
        },
      }),
    ])

    return plan
  },

  async publishPlan(id: string, userId: string) {
    await requireCmsUpdate(userId)
    const existing = await contentPlanQueries.getPlanById(id)
    if (!existing) throw new NotFoundError('Content plan tidak ditemukan.')
    if (existing.status !== ContentPlanStatus.READY) {
      throw new ValidationError('Content plan harus READY sebelum ditandai PUBLISHED.')
    }

    const [plan] = await prisma.$transaction([
      prisma.contentPlan.update({
        where: { id },
        data: {
          status: ContentPlanStatus.PUBLISHED,
          updatedBy: userId,
        },
      }),
      prisma.auditLog.create({
        data: {
          action: 'PUBLISH',
          entity: 'ContentPlan',
          entityId: id,
          oldData: JSON.stringify(existing),
          newData: JSON.stringify({ status: ContentPlanStatus.PUBLISHED }),
          userId,
        },
      }),
    ])

    return plan
  },
}
