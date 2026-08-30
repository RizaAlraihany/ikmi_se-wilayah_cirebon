import { ContentPlanStatus, PamfletRequestStatus, Prisma } from '@prisma/client'
import { KOMDIGI_DASHBOARD_ROLE_IDS } from '@/core/auth/roles'
import { prisma } from '@/core/database/prisma'
import { NotFoundError, ValidationError } from '@/core/errors/custom-errors'
import { requireContentPlanActor } from './access'
import { isSafeContentUrl } from './domain'
import {
  contentPlanCreateSchema,
  contentPlanUpdateSchema,
} from './schemas'

async function validateReferences(data: {
  authorId?: string
  programId?: string | null
  agendaId?: string | null
}) {
  const [author, program, agenda] = await Promise.all([
    data.authorId
      ? prisma.user.findFirst({
        where: { id: data.authorId, deletedAt: null, isActive: true, roleId: { in: [...KOMDIGI_DASHBOARD_ROLE_IDS] } },
        select: { id: true },
      })
      : null,
    data.programId
      ? prisma.program.findFirst({ where: { id: data.programId, deletedAt: null }, select: { id: true } })
      : null,
    data.agendaId
      ? prisma.agenda.findFirst({ where: { id: data.agendaId, deletedAt: null }, select: { id: true } })
      : null,
  ])
  if (data.authorId && !author) throw new ValidationError('PIC Admin Komdigi tidak ditemukan atau tidak aktif.')
  if (data.programId && !program) throw new ValidationError('Program terkait tidak ditemukan.')
  if (data.agendaId && !agenda) throw new ValidationError('Agenda terkait tidak ditemukan.')
}

function defined<T>(value: T | undefined, factory: (value: T) => object) {
  return value === undefined ? {} : factory(value)
}

export const contentPlanService = {
  async createPlan(input: unknown, userId: string) {
    const actor = await requireContentPlanActor(userId)
    const validated = contentPlanCreateSchema.parse(input)

    const sourceRequest = validated.pamfletRequestId
      ? await prisma.pamfletRequest.findFirst({
        where: { id: validated.pamfletRequestId, deletedAt: null },
        select: {
          id: true,
          requestNumber: true,
          status: true,
          activityName: true,
          programId: true,
          agendaId: true,
          deadline: true,
          description: true,
          referenceLink: true,
          attachmentPublicId: true,
          requesterNotes: true,
          notes: true,
        },
      })
      : null

    if (validated.pamfletRequestId && !sourceRequest) throw new NotFoundError('Request Pamflet asal tidak ditemukan.')
    const convertibleStatuses: PamfletRequestStatus[] = [
      PamfletRequestStatus.DITERIMA,
      PamfletRequestStatus.DIKERJAKAN,
      PamfletRequestStatus.SELESAI,
    ]
    if (sourceRequest && !convertibleStatuses.includes(sourceRequest.status)) {
      throw new ValidationError('Hanya Request Pamflet yang diterima atau diproses dapat dikonversi.')
    }
    if (sourceRequest) {
      const existingConversion = await prisma.contentPlan.findFirst({
        where: { pamfletRequestId: sourceRequest.id, deletedAt: null },
        select: { id: true },
      })
      if (existingConversion) throw new ValidationError('Request Pamflet ini sudah memiliki Content Plan.')
    }

    const programId = sourceRequest?.programId ?? validated.programId ?? null
    const agendaId = sourceRequest?.agendaId ?? validated.agendaId ?? null
    await validateReferences({ authorId: validated.authorId, programId, agendaId })

    const carriedNotes = sourceRequest
      ? [
        `Request asal: ${sourceRequest.requestNumber}`,
        `Deadline Request: ${sourceRequest.deadline.toISOString()}`,
        `Informasi Request: ${sourceRequest.description}`,
        sourceRequest.requesterNotes ? `Catatan pengaju: ${sourceRequest.requesterNotes}` : null,
        sourceRequest.notes ? `Catatan internal: ${sourceRequest.notes}` : null,
        sourceRequest.referenceLink ? `Referensi: ${sourceRequest.referenceLink}` : null,
      ].filter((note): note is string => Boolean(note)).join('\n\n')
      : validated.notes || null

    const stored = {
      title: sourceRequest?.activityName ?? validated.title,
      platform: validated.platform,
      contentType: validated.contentType,
      programId,
      agendaId,
      notes: carriedNotes,
      // Lampiran Request tetap privat; Content Plan hanya menyimpan endpoint berotorisasi.
      assetUrl: sourceRequest?.attachmentPublicId
        ? `/api/private/pamflet-requests/${sourceRequest.id}`
        : (isSafeContentUrl(validated.assetUrl) ? validated.assetUrl : null),
      publishedUrl: validated.publishedUrl || null,
      publishDate: validated.publishDate,
      status: validated.status,
      authorId: validated.authorId,
      pamfletRequestId: sourceRequest?.id ?? null,
      createdBy: actor.id,
    }

    try {
      return await prisma.$transaction(async (tx) => {
        const plan = await tx.contentPlan.create({ data: stored })
        await tx.auditLog.create({
          data: {
            action: stored.status === 'PUBLISHED' ? 'PUBLISH' : 'CREATE',
            entity: 'ContentPlan',
            entityId: plan.id,
            newData: JSON.stringify(stored),
            userId: actor.id,
          },
        })
        return plan
      })
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002' && sourceRequest) {
        throw new ValidationError('Request Pamflet ini sudah memiliki Content Plan.')
      }
      throw error
    }
  },

  async updatePlan(input: unknown, userId: string) {
    const actor = await requireContentPlanActor(userId)
    const validated = contentPlanUpdateSchema.parse(input)
    const existing = await prisma.contentPlan.findFirst({ where: { id: validated.id, deletedAt: null } })
    if (!existing) throw new NotFoundError('Content Plan tidak ditemukan.')
    await validateReferences(validated)

    const targetStatus = validated.status ?? existing.status
    const targetPublishedUrl = validated.publishedUrl === undefined ? existing.publishedUrl : validated.publishedUrl
    if (targetStatus === ContentPlanStatus.PUBLISHED && existing.status !== ContentPlanStatus.PUBLISHED) {
      const publishableStatuses: ContentPlanStatus[] = [ContentPlanStatus.READY, ContentPlanStatus.SCHEDULED]
      if (!publishableStatuses.includes(existing.status)) {
        throw new ValidationError('Content Plan harus berstatus Siap atau Terjadwal sebelum dipublikasikan.')
      }
      if (!targetPublishedUrl) throw new ValidationError('URL publikasi wajib diisi sebelum ditandai Dipublikasikan.')
    }
    if (existing.status === ContentPlanStatus.PUBLISHED && targetStatus !== ContentPlanStatus.PUBLISHED) {
      throw new ValidationError('Content Plan yang sudah dipublikasikan tidak dapat dikembalikan ke status produksi.')
    }

    const patch = {
      ...defined(validated.title, (title) => ({ title })),
      ...defined(validated.platform, (platform) => ({ platform })),
      ...defined(validated.contentType, (contentType) => ({ contentType })),
      ...defined(validated.programId, (programId) => ({ programId })),
      ...defined(validated.agendaId, (agendaId) => ({ agendaId })),
      ...defined(validated.notes, (notes) => ({ notes })),
      ...defined(validated.assetUrl, (assetUrl) => ({ assetUrl })),
      ...defined(validated.publishedUrl, (publishedUrl) => ({ publishedUrl })),
      ...defined(validated.publishDate, (publishDate) => ({ publishDate })),
      ...defined(validated.status, (status) => ({ status })),
      ...defined(validated.authorId, (authorId) => ({ authorId })),
      updatedBy: actor.id,
    }
    const publishTransition = targetStatus === ContentPlanStatus.PUBLISHED && existing.status !== ContentPlanStatus.PUBLISHED

    return prisma.$transaction(async (tx) => {
      const plan = await tx.contentPlan.update({ where: { id: validated.id }, data: patch })
      await tx.auditLog.create({
        data: {
          action: publishTransition ? 'PUBLISH' : 'UPDATE',
          entity: 'ContentPlan',
          entityId: validated.id,
          oldData: JSON.stringify(existing),
          newData: JSON.stringify(patch),
          userId: actor.id,
        },
      })
      return plan
    })
  },

  async publishPlan(id: string, userId: string) {
    return this.updatePlan({ id, status: ContentPlanStatus.PUBLISHED }, userId)
  },
}
