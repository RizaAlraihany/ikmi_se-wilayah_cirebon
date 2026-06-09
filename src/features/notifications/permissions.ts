import { can, SessionUser } from '@/core/authorization/rbac'

export const notificationPermissions = {
  read: 'notification.read',
  manage: 'notification.manage',
  delete: 'notification.delete',
} as const

export function ownsNotification(user: SessionUser, notificationUserId: string) {
  return user.id === notificationUserId
}

export async function canManageNotifications(user: SessionUser | null | undefined) {
  if (!user) return false
  return can('system.manage', user)
}

export async function canViewNotificationAnalytics(user: SessionUser | null | undefined) {
  if (!user) return false
  return (await can('audit.view', user)) || (await can('system.manage', user))
}
