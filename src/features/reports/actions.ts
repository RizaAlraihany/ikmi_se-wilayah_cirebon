'use server'

import { requirePermission } from '@/core/authorization/guards'
import { LPJ_SUBMIT_PERMISSION, LPJ_VERIFY_BPH_PERMISSION } from '@/core/authorization/permission-ids'
import { prisma } from '@/core/database/prisma'
import { reportService } from './services'
import { revalidatePath } from 'next/cache'
import { rateLimit } from '@/core/security/rate-limiter'
import { validateDocumentSignature } from '@/core/storage/file-validator'
import { cloudinaryFolders, storageService } from '@/core/storage/storage-service'
import { safeActionError } from '@/core/errors/safe-action-error'

function formString(formData: FormData, key: string) {
  const value = formData.get(key)
  return typeof value === 'string' ? value.trim() : ''
}

export async function submitReportAction(formData: FormData) {
  let uploaded: { publicId: string; secureUrl: string } | null = null
  try {
    const actor = await requirePermission(LPJ_SUBMIT_PERMISSION)
    await rateLimit(`report:upload:${actor.id}`, 30, 3600)

    const eventId = formString(formData, 'eventId')
    const file = formData.get('documentFile')
    if (!eventId || eventId.length > 150 || !(file instanceof File) || file.size === 0) {
      return { error: 'Event dan dokumen LPJ wajib diisi.' }
    }

    const validation = await validateDocumentSignature(file)
    if (!validation.valid) return { error: validation.error || 'Dokumen LPJ tidak valid.' }

    const event = await prisma.event.findFirst({
      where: { id: eventId, deletedAt: null },
      select: { id: true, title: true },
    })
    if (!event) return { error: 'Event tidak ditemukan.' }

    uploaded = await storageService.uploadPrivateDocument(file, cloudinaryFolders.reports)
    await reportService.submitReport({
      title: `LPJ: ${event.title}`,
      eventId: event.id,
      documentUrl: uploaded.secureUrl,
      documentPublicId: uploaded.publicId,
    }, actor.id)
    revalidatePath('/admin/reports')
    revalidatePath('/dashboard/reports')
    return { success: true }
  } catch (error) {
    if (uploaded) await storageService.deleteFile(uploaded.publicId, 'raw', 'authenticated').catch(() => undefined)
    return { error: safeActionError(error, 'LPJ belum dapat dikirim.', 'report.submit') }
  }
}

/**
 * Verifikasi LPJ oleh Bendahara (single-step).
 */
export async function verifyReportAction(id: string, notes?: string) {
  try {
    const actor = await requirePermission(LPJ_VERIFY_BPH_PERMISSION)
    await reportService.verifyReport(id, actor.id, notes)
    revalidatePath('/admin/reports')
    return { success: true }
  } catch (error) {
    return { error: safeActionError(error, 'LPJ belum dapat diverifikasi.', 'report.verify') }
  }
}

export async function rejectReportAction(id: string, notes?: string) {
  try {
    const actor = await requirePermission(LPJ_VERIFY_BPH_PERMISSION)
    await reportService.rejectReport(id, actor.id, notes)
    revalidatePath('/admin/reports')
    return { success: true }
  } catch (error) {
    return { error: safeActionError(error, 'LPJ belum dapat ditolak.', 'report.reject') }
  }
}
