'use server'

import { auth } from '@/core/auth/auth'
import { revalidatePath } from 'next/cache'
import { announcementService } from './services'
import { announcementRepository } from './repository'
import { createAnnouncementSchema, CreateAnnouncementInput } from './schemas'

export async function createAnnouncementAction(input: CreateAnnouncementInput, publish = false) {
  try {
    const session = await auth()
    if (!session?.user?.id) return { error: 'Akses ditolak atau sesi habis.' }

    const validated = createAnnouncementSchema.parse(input)
    await announcementService.createAnnouncement(validated, session.user.id, publish)

    revalidatePath('/admin/announcements')
    return { success: true }
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') return { error: 'Data tidak valid' }
    if (error instanceof Error) return { error: error.message }
    return { error: 'Terjadi kesalahan' }
  }
}

export async function publishAnnouncementAction(id: string) {
  try {
    const session = await auth()
    if (!session?.user?.id) return { error: 'Akses ditolak.' }

    await announcementService.publishAnnouncement(id, session.user.id)

    revalidatePath('/admin/announcements')
    return { success: true }
  } catch (error) {
    if (error instanceof Error) return { error: error.message }
    return { error: 'Terjadi kesalahan' }
  }
}

export async function deleteAnnouncementAction(id: string) {
  try {
    const session = await auth()
    if (!session?.user?.id) return { error: 'Akses ditolak.' }

    await announcementRepository.softDelete(id, session.user.id)

    revalidatePath('/admin/announcements')
    return { success: true }
  } catch (error) {
    if (error instanceof Error) return { error: error.message }
    return { error: 'Terjadi kesalahan' }
  }
}
