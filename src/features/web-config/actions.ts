'use server'

import { auth } from '@/core/auth/auth'
import { webConfigService } from './services'
import { WebConfigInput } from './schemas'
import { revalidatePath } from 'next/cache'

export async function upsertWebConfigAction(data: WebConfigInput) {
  try {
    const session = await auth()
    if (!session?.user?.id) return { error: 'Akses ditolak.' }

    await webConfigService.upsertWebConfig(data, session.user.id)
    revalidatePath('/dashboard/config')
    return { success: true }
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') return { error: 'Data tidak valid' }
    if (error instanceof Error) return { error: error.message }
    return { error: 'Terjadi kesalahan' }
  }
}
