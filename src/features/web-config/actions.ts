'use server'

import { requirePermission } from '@/core/authorization/guards'
import { webConfigService } from './services'
import { requireCmsUpdate } from '@/features/cms/access'
import { WebConfigInput } from './schemas'
import { revalidatePath } from 'next/cache'
import { rateLimit } from '@/core/security/rate-limiter'
import { validateImageSignature } from '@/core/storage/file-validator'
import { cloudinaryFolders, storageService } from '@/core/storage/storage-service'
import { safeActionError } from '@/core/errors/safe-action-error'

export async function upsertWebConfigAction(data: WebConfigInput) {
  try {
    const actor = await requirePermission('cms.update')
    await rateLimit(`cms:web-config:${actor.id}`, 30, 3600)

    await webConfigService.upsertWebConfig(data, actor.id)
    revalidatePath('/admin/cms/settings')
    revalidatePath('/')
    revalidatePath('/tentang-kami')
    revalidatePath('/publikasi')
    return { success: true }
  } catch (error) {
    return { error: safeActionError(error, 'Pengaturan website belum dapat disimpan.', 'web_config.upsert') }
  }
}

export async function uploadWebConfigImageAction(formData: FormData) {
  try {
    const actor = await requirePermission('cms.update')
    await requireCmsUpdate(actor.id)
    await rateLimit(`cms:web-config:image:${actor.id}`, 40, 3600)

    const file = formData.get('file')
    if (!(file instanceof File) || file.size === 0) {
      return { error: 'File gambar wajib dipilih.' }
    }

    const validation = await validateImageSignature(file)
    if (!validation.valid) return { error: validation.error || 'File gambar tidak valid.' }

    const uploaded = await storageService.uploadImage(file, cloudinaryFolders.website)
    return { success: true, url: uploaded.secureUrl, publicId: uploaded.publicId }
  } catch (error) {
    return { error: safeActionError(error, 'Gambar website belum dapat diunggah.', 'web_config.image_upload') }
  }
}
