'use server'

import { auth } from '@/core/auth/auth'
import { reportService } from './services'
import { ReportSubmitInput } from './schemas'
import { revalidatePath } from 'next/cache'
import { validateDocument } from '@/core/storage/file-validator'
import { cloudinaryFolders, storageService } from '@/core/storage/storage-service'

export async function submitReportAction(data: ReportSubmitInput) {
  try {
    const session = await auth()
    if (!session?.user?.id) return { error: 'Akses ditolak.' }

    await reportService.submitReport(data, session.user.id)
    revalidatePath('/admin/reports')
    revalidatePath('/dashboard/reports')
    return { success: true }
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') return { error: 'Data tidak valid' }
    if (error instanceof Error) return { error: error.message || 'Terjadi kesalahan' }
    return { error: 'Terjadi kesalahan' }
  }
}

export async function uploadReportDocumentAction(formData: FormData) {
  try {
    const session = await auth()
    if (!session?.user?.id) return { error: 'Akses ditolak.' }

    const file = formData.get('file')
    if (!(file instanceof File) || file.size === 0) {
      return { error: 'Dokumen LPJ wajib dipilih.' }
    }

    const validation = validateDocument(file)
    if (!validation.valid) return { error: validation.error || 'File tidak valid.' }

    const uploaded = await storageService.uploadDocument(file, cloudinaryFolders.reports)
    return { success: true, url: uploaded.secureUrl, publicId: uploaded.publicId }
  } catch (error) {
    if (error instanceof Error) return { error: error.message || 'Terjadi kesalahan' }
    return { error: 'Terjadi kesalahan' }
  }
}

/**
 * Verifikasi LPJ oleh Bendahara (single-step).
 */
export async function verifyReportAction(id: string, notes?: string) {
  try {
    const session = await auth()
    if (!session?.user?.id) return { error: 'Akses ditolak.' }

    await reportService.verifyReport(id, session.user.id, notes)
    revalidatePath('/admin/reports')
    return { success: true }
  } catch (error) {
    if (error instanceof Error) return { error: error.message }
    return { error: 'Terjadi kesalahan' }
  }
}

export async function rejectReportAction(id: string, notes?: string) {
  try {
    const session = await auth()
    if (!session?.user?.id) return { error: 'Akses ditolak.' }

    await reportService.rejectReport(id, session.user.id, notes)
    revalidatePath('/admin/reports')
    return { success: true }
  } catch (error) {
    if (error instanceof Error) return { error: error.message }
    return { error: 'Terjadi kesalahan' }
  }
}
