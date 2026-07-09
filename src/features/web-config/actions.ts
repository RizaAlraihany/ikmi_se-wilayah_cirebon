'use server'

import { auth } from '@/core/auth/auth'
import { webConfigService } from './services'
import { WebConfigInput } from './schemas'
import { revalidatePath } from 'next/cache'
import { rateLimit } from '@/core/security/rate-limiter'
import { validateImage } from '@/core/storage/file-validator'
import { cloudinaryFolders, storageService } from '@/core/storage/storage-service'

export async function upsertWebConfigAction(data: WebConfigInput) {
  try {
    const session = await auth()
    if (!session?.user?.id) return { error: 'Akses ditolak.' }
    await rateLimit(`cms:web-config:${session.user.id}`, 30, 3600)

    await webConfigService.upsertWebConfig(data, session.user.id)
    revalidatePath('/admin/cms/settings')
    revalidatePath('/')
    revalidatePath('/tentang-kami')
    revalidatePath('/blog')
    return { success: true }
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') return { error: 'Data tidak valid' }
    if (error instanceof Error) return { error: error.message }
    return { error: 'Terjadi kesalahan' }
  }
}

export async function uploadWebConfigImageAction(formData: FormData) {
  try {
    const session = await auth()
    if (!session?.user?.id) return { error: 'Akses ditolak.' }
    await rateLimit(`cms:web-config:image:${session.user.id}`, 40, 3600)

    const file = formData.get('file')
    if (!(file instanceof File) || file.size === 0) {
      return { error: 'File gambar wajib dipilih.' }
    }

    const validation = validateImage(file)
    if (!validation.valid) return { error: validation.error || 'File gambar tidak valid.' }

    const uploaded = await storageService.uploadImage(file, cloudinaryFolders.website)
    return { success: true, url: uploaded.secureUrl, publicId: uploaded.publicId }
  } catch (error) {
    if (error instanceof Error) return { error: error.message }
    return { error: 'Terjadi kesalahan saat upload gambar' }
  }
}
