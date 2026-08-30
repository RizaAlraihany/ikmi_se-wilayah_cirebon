'use server'

import { revalidatePath } from 'next/cache'
import { requirePermission } from '@/core/authorization/guards'
import { rateLimit } from '@/core/security/rate-limiter'
import { safeActionError } from '@/core/errors/safe-action-error'
import { mediaService } from './services'

export async function uploadMediaAction(formData: FormData) {
  try {
    const actor = await requirePermission('cms.update')
    await rateLimit(`cms:media:upload:${actor.id}`, 20, 3600)

    const file = formData.get('file')
    if (!(file instanceof File) || file.size === 0) {
      return { error: 'File wajib dipilih.' }
    }

    await mediaService.uploadMedia(file, actor.id)
    revalidatePath('/admin/cms/media')
    return { success: true }
  } catch (error) {
    return { error: safeActionError(error, 'Media belum dapat diunggah.', 'media.upload') }
  }
}

export async function deleteMediaAction(id: string) {
  try {
    const actor = await requirePermission('cms.update')
    await rateLimit(`cms:media:delete:${actor.id}`, 60, 3600)

    await mediaService.deleteMedia(id, actor.id)
    revalidatePath('/admin/cms/media')
    return { success: true }
  } catch (error) {
    return { error: safeActionError(error, 'Media belum dapat dihapus.', 'media.delete') }
  }
}
