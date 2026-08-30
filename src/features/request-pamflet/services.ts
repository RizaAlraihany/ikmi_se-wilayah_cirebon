import { randomUUID } from 'node:crypto'
import { Prisma } from '@prisma/client'
import { prisma } from '@/core/database/prisma'
import { ValidationError } from '@/core/errors/custom-errors'
import { logger } from '@/core/monitoring/logger'
import {
  ALLOWED_IMAGE_TYPES,
  validateImageOrDocumentSignature,
} from '@/core/storage/file-validator'
import { cloudinaryFolders, storageService } from '@/core/storage/storage-service'
import { jakartaDateParts } from '@/features/public/calendar-domain'
import {
  formatEventTime,
  nextRequestNumber,
  parseJakartaDateOnly,
  parseRelatedEntity,
  requestNumberPrefix,
} from './domain'
import type { RequestPamfletData } from './schemas'

async function validateRelatedEntity(programId: string | null, agendaId: string | null) {
  const [program, agenda] = await Promise.all([
    programId
      ? prisma.program.findFirst({
        where: { id: programId, deletedAt: null, visibility: 'PUBLIC' },
        select: { id: true },
      })
      : null,
    agendaId
      ? prisma.agenda.findFirst({
        where: {
          id: agendaId,
          deletedAt: null,
          visibility: 'PUBLIC',
          status: { notIn: ['DRAFT', 'ARCHIVED'] },
        },
        select: { id: true },
      })
      : null,
  ])

  if ((programId && !program) || (agendaId && !agenda)) {
    throw new ValidationError('Program atau Agenda yang dipilih tidak tersedia untuk publik.')
  }
}

function validateSchedule(data: RequestPamfletData, now: Date) {
  const eventDate = parseJakartaDateOnly(data.eventDate)
  const deadline = parseJakartaDateOnly(data.deadline)
  if (Number.isNaN(eventDate.getTime()) || Number.isNaN(deadline.getTime())) {
    throw new ValidationError('Tanggal kegiatan atau deadline tidak valid.')
  }

  const current = jakartaDateParts(now)
  const today = parseJakartaDateOnly(`${current.year}-${String(current.month + 1).padStart(2, '0')}-${String(current.day).padStart(2, '0')}`)
  if (eventDate < today) throw new ValidationError('Tanggal kegiatan tidak boleh sudah lewat.')
  if (deadline < today) throw new ValidationError('Deadline pengerjaan tidak boleh sudah lewat.')
  if (deadline > eventDate) throw new ValidationError('Deadline pengerjaan harus pada atau sebelum tanggal kegiatan.')
  return { eventDate, deadline }
}

export const pamfletRequestService = {
  async createPublicRequest(data: RequestPamfletData, attachment?: File, now = new Date()) {
    const { programId, agendaId } = parseRelatedEntity(data.relatedEntity)
    const { eventDate, deadline } = validateSchedule(data, now)
    await validateRelatedEntity(programId, agendaId)

    let uploaded: {
      secureUrl: string
      publicId: string
      resourceType: 'image' | 'raw'
    } | null = null

    if (attachment && attachment.size > 0) {
      const validation = await validateImageOrDocumentSignature(attachment)
      if (!validation.valid) throw new ValidationError(validation.error ?? 'Lampiran tidak valid.')

      if (ALLOWED_IMAGE_TYPES.includes(attachment.type)) {
        const result = await storageService.uploadPrivateImage(attachment, cloudinaryFolders.pamfletRequests)
        uploaded = { ...result, resourceType: 'image' }
      } else {
        const result = await storageService.uploadPrivateDocument(attachment, cloudinaryFolders.pamfletRequests)
        uploaded = { ...result, resourceType: 'raw' }
      }
    }

    const prefix = requestNumberPrefix(now)
    const provisionalNumber = `PENDING-${randomUUID()}`

    try {
      return await prisma.$transaction(async (tx) => {
        const draft = await tx.pamfletRequest.create({
          data: {
            requestNumber: provisionalNumber,
            requesterName: data.requesterName,
            requesterUnit: data.requesterUnit,
            requesterWhatsapp: data.requesterWhatsapp,
            programId,
            agendaId,
            activityName: data.activityName,
            theme: data.theme || null,
            eventDate,
            eventTime: formatEventTime(data.eventStartTime, data.eventEndTime),
            location: data.location || null,
            requestType: data.requestType,
            description: data.description,
            contactPerson: data.contactPerson || null,
            caption: data.caption || null,
            deadline,
            referenceLink: data.referenceLink || null,
            attachmentUrl: uploaded?.secureUrl ?? null,
            attachmentPublicId: uploaded?.publicId ?? null,
            attachmentOriginalName: attachment?.name ?? null,
            attachmentMimeType: attachment?.type ?? null,
            attachmentSize: attachment?.size ?? null,
            requesterNotes: data.requesterNotes || null,
          },
          select: { id: true },
        })

        // A transaction-scoped lock serializes the annual sequence while
        // preserving the required SAVE -> GENERATE NUMBER workflow.
        await tx.$executeRaw(Prisma.sql`SELECT pg_advisory_xact_lock(hashtext(${prefix}))`)
        const latest = await tx.pamfletRequest.findFirst({
          where: { requestNumber: { startsWith: prefix } },
          orderBy: { requestNumber: 'desc' },
          select: { requestNumber: true },
        })
        const requestNumber = nextRequestNumber(prefix, latest?.requestNumber)

        return tx.pamfletRequest.update({
          where: { id: draft.id },
          data: { requestNumber },
          select: {
            id: true,
            requestNumber: true,
            activityName: true,
            requesterName: true,
            requesterUnit: true,
            deadline: true,
          },
        })
      })
    } catch (error) {
      if (uploaded) {
        await storageService.deleteFile(uploaded.publicId, uploaded.resourceType, 'authenticated').catch((cleanupError) => {
          logger.error(cleanupError, { workflow: 'pamflet_request_upload_cleanup' })
        })
      }
      throw error
    }
  },
}
