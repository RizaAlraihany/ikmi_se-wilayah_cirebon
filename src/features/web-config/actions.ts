'use server'

import { auth } from '@/core/auth/auth'
import { webConfigService } from './services'
import { WebConfigInput } from './schemas'
import { revalidatePath } from 'next/cache'
import { rateLimit } from '@/core/security/rate-limiter'

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
