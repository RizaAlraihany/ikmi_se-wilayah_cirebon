'use server'

import { letterService } from './services'
import { createLetterSchema } from './schemas'
import { requirePermission } from '@/core/authorization/guards'
import { revalidatePath } from 'next/cache'
import { rateLimit } from '@/core/security/rate-limiter'
import { validateDocumentSignature } from '@/core/storage/file-validator'
import { cloudinaryFolders, storageService } from '@/core/storage/storage-service'
import { safeActionError } from '@/core/errors/safe-action-error'

const letterMetadataSchema = createLetterSchema.omit({ fileUrl: true, filePublicId: true })

export async function createLetterAction(formData: FormData) {
  let uploaded: { publicId: string; secureUrl: string } | null = null
  try {
    const sessionUser = await requirePermission('letter.create')
    await rateLimit(`letter:upload:${sessionUser.id}`, 30, 3600)

    const parsed = letterMetadataSchema.parse({
      type: formData.get('type'),
      subject: formData.get('subject'),
      date: formData.get('date'),
    })
    const file = formData.get('file')
    if (!(file instanceof File) || file.size === 0) return { error: 'Dokumen surat wajib dipilih.' }

    const validation = await validateDocumentSignature(file)
    if (!validation.valid) return { error: validation.error || 'Dokumen surat tidak valid.' }

    uploaded = await storageService.uploadPrivateDocument(file, cloudinaryFolders.letters)
    await letterService.createLetter({
      ...parsed,
      fileUrl: uploaded.secureUrl,
      filePublicId: uploaded.publicId,
    }, sessionUser)

    revalidatePath('/admin/letters')
    return { success: true }
  } catch (error) {
    if (uploaded) await storageService.deleteFile(uploaded.publicId, 'raw', 'authenticated').catch(() => undefined)
    return { error: safeActionError(error, 'Surat belum dapat dibuat.', 'letter.create') }
  }
}

export async function deleteLetterAction(id: string) {
  try {
    const sessionUser = await requirePermission('letter.delete')

    await letterService.deleteLetter(id, sessionUser)
    revalidatePath('/admin/letters')
    return { success: true }
  } catch (error) {
    return { error: safeActionError(error, 'Surat belum dapat dihapus.', 'letter.delete') }
  }
}
