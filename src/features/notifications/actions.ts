'use server'

import { requireAuth } from '@/core/authorization/guards'
import { notificationService } from './services'
import { revalidatePath } from 'next/cache'
import { safeActionError } from '@/core/errors/safe-action-error'
import { notificationPreferenceSchema } from './schemas'

export async function markNotificationReadAction(id: string) {
  try {
    const actor = await requireAuth()
    await notificationService.markSingleRead(id, actor.id)
    revalidatePath('/dashboard')
    return { success: true }
  } catch (error) {
    return { error: safeActionError(error, 'Notifikasi belum dapat ditandai.', 'notification.read') }
  }
}

export async function markAllNotificationsReadAction() {
  try {
    const actor = await requireAuth()
    await notificationService.markAllRead(actor.id)
    revalidatePath('/dashboard')
    return { success: true }
  } catch (error) {
    return { error: safeActionError(error, 'Notifikasi belum dapat diperbarui.', 'notification.unread') }
  }
}

export async function markNotificationUnreadAction(id: string) {
  try {
    const actor = await requireAuth()
    await notificationService.markSingleUnread(id, actor.id)
    revalidatePath('/dashboard')
    return { success: true }
  } catch (error) {
    return { error: safeActionError(error, 'Notifikasi belum dapat diperbarui.', 'notification.read_all') }
  }
}

export async function deleteNotificationAction(id: string) {
  try {
    const actor = await requireAuth()
    await notificationService.deleteNotification(id, actor.id)
    revalidatePath('/dashboard')
    return { success: true }
  } catch (error) {
    return { error: safeActionError(error, 'Notifikasi belum dapat dihapus.', 'notification.delete') }
  }
}

export async function updateNotificationPreferencesAction(formData: FormData) {
  try {
    const actor = await requireAuth()

    const parsed = notificationPreferenceSchema.parse({
      system: formData.get('system') === 'on',
      workflow: formData.get('workflow') === 'on',
      membership: formData.get('membership') === 'on',
      finance: formData.get('finance') === 'on',
      lpj: formData.get('lpj') === 'on',
      cms: formData.get('cms') === 'on',
      letters: formData.get('letters') === 'on',
    })

    await notificationService.updatePreferences(actor.id, parsed)
    revalidatePath('/dashboard/admin/notifications')
    return { success: true }
  } catch (error) {
    return { error: safeActionError(error, 'Notifikasi belum dapat dibuat.', 'notification.create') }
  }
}
