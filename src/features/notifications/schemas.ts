import { NotificationType } from '@prisma/client'
import { z } from 'zod'

export const notificationStatusSchema = z.enum(['all', 'unread', 'read', 'archived'])

export const notificationModuleSchema = z.enum([
  'all',
  'system',
  'workflow',
  'membership',
  'finance',
  'lpj',
  'cms',
  'letters',
])

export const createNotificationSchema = z.object({
  userId: z.string().min(1),
  type: z.nativeEnum(NotificationType).default(NotificationType.SYSTEM),
  title: z.string().min(1).max(160),
  message: z.string().min(1).max(1000),
  actionUrl: z.string().min(1).default('#'),
  createdBy: z.string().optional(),
})

export const bulkNotificationSchema = z.object({
  userIds: z.array(z.string().min(1)).min(1),
  type: z.nativeEnum(NotificationType).default(NotificationType.SYSTEM),
  title: z.string().min(1).max(160),
  message: z.string().min(1).max(1000),
  actionUrl: z.string().min(1).default('#'),
  createdBy: z.string().optional(),
})

export const notificationPreferenceSchema = z.object({
  system: z.boolean().default(true),
  workflow: z.boolean().default(true),
  membership: z.boolean().default(true),
  finance: z.boolean().default(true),
  lpj: z.boolean().default(true),
  cms: z.boolean().default(true),
  letters: z.boolean().default(true),
})

export type NotificationStatus = z.infer<typeof notificationStatusSchema>
export type NotificationModule = z.infer<typeof notificationModuleSchema>
export type CreateNotificationInput = z.infer<typeof createNotificationSchema>
export type BulkNotificationInput = z.infer<typeof bulkNotificationSchema>
export type NotificationPreferenceInput = z.infer<typeof notificationPreferenceSchema>

export const notificationModuleToTypes: Record<NotificationModule, NotificationType[] | undefined> = {
  all: undefined,
  system: [NotificationType.SYSTEM],
  workflow: [NotificationType.SYSTEM, NotificationType.OTHER],
  membership: [NotificationType.REGISTRATION],
  finance: [NotificationType.FINANCE],
  lpj: [NotificationType.LPJ],
  cms: [NotificationType.POST],
  letters: [NotificationType.SYSTEM, NotificationType.OTHER],
}
