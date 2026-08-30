'use server'

import { requirePermission } from '@/core/authorization/guards'
import { revalidatePath } from 'next/cache'
import { announcementService } from './services'
import { createAnnouncementSchema, CreateAnnouncementInput } from './schemas'
import { safeActionError } from '@/core/errors/safe-action-error'

export async function createAnnouncementAction(input: CreateAnnouncementInput, publish = false) {
  try {
    const actor = await requirePermission('announcement.manage')
    const validated = createAnnouncementSchema.parse(input)
    await announcementService.createAnnouncement(validated, actor.id, publish)

    revalidatePath('/admin/announcements')
    return { success: true }
  } catch (error) {
    return { error: safeActionError(error, 'Pengumuman belum dapat dibuat.', 'announcement.create') }
  }
}

export async function publishAnnouncementAction(id: string) {
  try {
    const actor = await requirePermission('announcement.manage')
    await announcementService.publishAnnouncement(id, actor.id)

    revalidatePath('/admin/announcements')
    return { success: true }
  } catch (error) {
    return { error: safeActionError(error, 'Pengumuman belum dapat dipublikasikan.', 'announcement.publish') }
  }
}

export async function deleteAnnouncementAction(id: string) {
  try {
    const actor = await requirePermission('announcement.manage')
    await announcementService.deleteAnnouncement(id, actor.id)

    revalidatePath('/admin/announcements')
    return { success: true }
  } catch (error) {
    return { error: safeActionError(error, 'Pengumuman belum dapat dihapus.', 'announcement.delete') }
  }
}
