'use server'

import { PamfletRequestStatus, Prisma } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { isKomdigiAdminRole, isSuperAdminRole } from '@/core/auth/roles'
import { requirePermission } from '@/core/authorization/guards'
import { prisma } from '@/core/database/prisma'
import { ForbiddenError, NotFoundError, ValidationError } from '@/core/errors/custom-errors'
import { notifyAdminKomdigiPamfletRequest } from '@/features/notification/whatsapp'
import {
  assertPamfletStatusTransition,
  validatePamfletStatusNotes,
} from './domain'

async function requirePamfletWorkspaceAccess(permission: 'content_plan.view' | 'content_plan.manage') {
  const user = await requirePermission(permission)
  if (!isKomdigiAdminRole(user.roleId) && !isSuperAdminRole(user.roleId)) {
    throw new ForbiddenError('Request Pamflet hanya dapat diakses oleh Admin Komdigi.')
  }
  return user
}

function assertEntityId(id: string) {
  if (!id?.trim() || id.length > 150) throw new NotFoundError('Request Pamflet tidak ditemukan.')
  return id.trim()
}

function assertPamfletStatus(status: PamfletRequestStatus) {
  if (!Object.values(PamfletRequestStatus).includes(status)) {
    throw new ValidationError('Status Request Pamflet tidak valid.')
  }
}

function refreshPamfletRequestPaths(id: string) {
  revalidatePath('/admin')
  revalidatePath('/admin/request-pamflet')
  revalidatePath(`/admin/request-pamflet/${id}`)
}

function maskedRecipient(recipient: string) {
  if (recipient === 'NOT_CONFIGURED') return 'Konfigurasi penerima'
  return `•••• ${recipient.slice(-4)}`
}

export async function getPamfletRequests(search?: string, status?: PamfletRequestStatus) {
  await requirePamfletWorkspaceAccess('content_plan.view')
  const where: Prisma.PamfletRequestWhereInput = { deletedAt: null }
  if (search?.trim()) {
    const query = search.trim().slice(0, 120)
    where.OR = [
      { requestNumber: { contains: query, mode: 'insensitive' } },
      { activityName: { contains: query, mode: 'insensitive' } },
      { requesterName: { contains: query, mode: 'insensitive' } },
      { requesterUnit: { contains: query, mode: 'insensitive' } },
    ]
  }
  if (status) {
    assertPamfletStatus(status)
    where.status = status
  }

  return prisma.pamfletRequest.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      requestNumber: true,
      activityName: true,
      requesterName: true,
      requesterUnit: true,
      deadline: true,
      status: true,
      assignee: { select: { id: true, name: true } },
      program: { select: { id: true, name: true } },
      agenda: { select: { id: true, name: true } },
    },
  })
}

export async function getPamfletRequestById(rawId: string) {
  await requirePamfletWorkspaceAccess('content_plan.view')
  const id = assertEntityId(rawId)
  return prisma.pamfletRequest.findFirst({
    where: { id, deletedAt: null },
    select: {
      id: true,
      requestNumber: true,
      requesterName: true,
      requesterUnit: true,
      requesterWhatsapp: true,
      programId: true,
      agendaId: true,
      activityName: true,
      theme: true,
      eventDate: true,
      eventTime: true,
      location: true,
      requestType: true,
      description: true,
      contactPerson: true,
      caption: true,
      deadline: true,
      referenceLink: true,
      attachmentPublicId: true,
      attachmentOriginalName: true,
      attachmentMimeType: true,
      attachmentSize: true,
      requesterNotes: true,
      notes: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      assigneeId: true,
      assignee: { select: { id: true, name: true } },
      program: { select: { id: true, name: true } },
      agenda: { select: { id: true, name: true } },
      contentPlan: { select: { id: true, title: true, publishDate: true } },
    },
  })
}

export async function getPamfletRequestHistory(rawId: string) {
  await requirePamfletWorkspaceAccess('content_plan.view')
  const id = assertEntityId(rawId)
  return prisma.auditLog.findMany({
    where: { entity: 'PamfletRequest', entityId: id, deletedAt: null },
    orderBy: { createdAt: 'desc' },
    select: {
      action: true,
      oldData: true,
      newData: true,
      createdAt: true,
      user: { select: { name: true } },
    },
  })
}

export async function getPamfletRequestNotificationDeliveries(rawId: string) {
  await requirePamfletWorkspaceAccess('content_plan.view')
  const id = assertEntityId(rawId)
  const request = await prisma.pamfletRequest.findFirst({
    where: { id, deletedAt: null },
    select: { requestNumber: true },
  })
  if (!request) throw new NotFoundError('Request Pamflet tidak ditemukan.')

  const deliveries = await prisma.whatsappMessageLog.findMany({
    where: { idempotencyKey: { startsWith: `req_pamflet_${request.requestNumber}_` } },
    orderBy: { createdAt: 'asc' },
    select: {
      recipient: true,
      status: true,
      attemptCount: true,
      providerMessageId: true,
      sentAt: true,
      failedAt: true,
      errorMessage: true,
      updatedAt: true,
    },
  })

  return deliveries.map((delivery) => ({
    ...delivery,
    recipient: maskedRecipient(delivery.recipient),
  }))
}

export async function getPamfletRequestAssignees() {
  await requirePamfletWorkspaceAccess('content_plan.manage')
  return prisma.user.findMany({
    where: { roleId: 'admin_komdigi', isActive: true, deletedAt: null },
    orderBy: { name: 'asc' },
    select: { id: true, name: true },
  })
}

export async function updatePamfletRequestStatus(
  rawId: string,
  status: PamfletRequestStatus,
  notes?: string,
) {
  const user = await requirePamfletWorkspaceAccess('content_plan.manage')
  const id = assertEntityId(rawId)
  assertPamfletStatus(status)
  const normalizedNotes = validatePamfletStatusNotes(status, notes)
  const existing = await prisma.pamfletRequest.findFirst({
    where: { id, deletedAt: null },
    select: { id: true, status: true, notes: true },
  })
  if (!existing) throw new NotFoundError('Request Pamflet tidak ditemukan.')
  assertPamfletStatusTransition(existing.status, status)

  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.pamfletRequest.updateMany({
      where: { id, deletedAt: null, status: existing.status },
      data: {
        status,
        updatedBy: user.id,
        ...(normalizedNotes ? { notes: normalizedNotes } : {}),
      },
    })
    if (result.count !== 1) {
      throw new ValidationError('Request berubah saat diproses. Muat ulang halaman lalu coba lagi.')
    }

    await tx.auditLog.create({
      data: {
        action: 'STATUS_CHANGE',
        entity: 'PamfletRequest',
        entityId: id,
        oldData: JSON.stringify({ status: existing.status }),
        newData: JSON.stringify({ status, ...(normalizedNotes ? { notes: normalizedNotes } : {}) }),
        userId: user.id,
      },
    })

    const request = await tx.pamfletRequest.findUnique({ where: { id } })
    if (!request) throw new NotFoundError('Request Pamflet tidak ditemukan.')
    return request
  })

  refreshPamfletRequestPaths(id)
  return updated
}

export async function assignPamfletRequest(rawId: string, rawAssigneeId: string | null) {
  const user = await requirePamfletWorkspaceAccess('content_plan.manage')
  const id = assertEntityId(rawId)
  const assigneeId = rawAssigneeId?.trim() || null
  if (assigneeId && assigneeId.length > 150) throw new ValidationError('PIC tidak valid.')

  const existing = await prisma.pamfletRequest.findFirst({
    where: { id, deletedAt: null },
    select: { id: true, assigneeId: true },
  })
  if (!existing) throw new NotFoundError('Request Pamflet tidak ditemukan.')

  const assignee = assigneeId
    ? await prisma.user.findFirst({
      where: { id: assigneeId, roleId: 'admin_komdigi', isActive: true, deletedAt: null },
      select: { id: true, name: true },
    })
    : null
  if (assigneeId && !assignee) throw new ValidationError('PIC harus merupakan Admin Komdigi aktif.')
  if (existing.assigneeId === assigneeId) return existing

  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.pamfletRequest.updateMany({
      where: { id, deletedAt: null, assigneeId: existing.assigneeId },
      data: { assigneeId, updatedBy: user.id },
    })
    if (result.count !== 1) {
      throw new ValidationError('PIC berubah saat diproses. Muat ulang halaman lalu coba lagi.')
    }

    await tx.auditLog.create({
      data: {
        action: 'UPDATE',
        entity: 'PamfletRequest',
        entityId: id,
        oldData: JSON.stringify({ assigneeId: existing.assigneeId }),
        newData: JSON.stringify({ assigneeId, assigneeName: assignee?.name ?? null }),
        userId: user.id,
      },
    })

    const request = await tx.pamfletRequest.findUnique({ where: { id } })
    if (!request) throw new NotFoundError('Request Pamflet tidak ditemukan.')
    return request
  })

  refreshPamfletRequestPaths(id)
  return updated
}

export async function retryPamfletRequestNotification(rawId: string) {
  const user = await requirePamfletWorkspaceAccess('content_plan.manage')
  const id = assertEntityId(rawId)
  const request = await prisma.pamfletRequest.findFirst({
    where: { id, deletedAt: null },
    select: {
      id: true,
      requestNumber: true,
      activityName: true,
      requesterName: true,
      requesterUnit: true,
      deadline: true,
    },
  })
  if (!request) throw new NotFoundError('Request Pamflet tidak ditemukan.')

  const deliveries = await notifyAdminKomdigiPamfletRequest(request)
  const successfulDeliveries = deliveries.filter((delivery) => delivery.success).length
  await prisma.auditLog.create({
    data: {
      action: 'UPDATE',
      entity: 'PamfletRequest',
      entityId: request.id,
      newData: JSON.stringify({
        notificationRetry: true,
        successfulDeliveries,
        failedDeliveries: deliveries.length - successfulDeliveries,
      }),
      userId: user.id,
    },
  })

  refreshPamfletRequestPaths(id)
  return { success: deliveries.length > 0 && deliveries.every((delivery) => delivery.success), deliveries: deliveries.length }
}
