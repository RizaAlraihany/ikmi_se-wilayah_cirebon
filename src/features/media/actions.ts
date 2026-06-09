'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/core/auth/auth'
import { rateLimit } from '@/core/security/rate-limiter'
import { mediaService } from './services'

export async function uploadMediaAction(formData: FormData) {
  try {
    const session = await auth()
    if (!session?.user?.id) return { error: 'Akses ditolak.' }
    await rateLimit(`cms:media:upload:${session.user.id}`, 20, 3600)

    const file = formData.get('file')
    if (!(file instanceof File) || file.size === 0) {
      return { error: 'File wajib dipilih.' }
    }

    await mediaService.uploadMedia(file, session.user.id)
    revalidatePath('/admin/cms/media')
    return { success: true }
  } catch (error) {
    if (error instanceof Error) return { error: error.message }
    return { error: 'Terjadi kesalahan' }
  }
}

export async function deleteMediaAction(id: string) {
  try {
    const session = await auth()
    if (!session?.user?.id) return { error: 'Akses ditolak.' }
    await rateLimit(`cms:media:delete:${session.user.id}`, 60, 3600)

    await mediaService.deleteMedia(id, session.user.id)
    revalidatePath('/admin/cms/media')
    return { success: true }
  } catch (error) {
    if (error instanceof Error) return { error: error.message }
    return { error: 'Terjadi kesalahan' }
  }
}
