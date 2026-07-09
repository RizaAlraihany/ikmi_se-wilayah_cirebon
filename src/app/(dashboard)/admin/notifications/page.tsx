import Link from 'next/link'
import { Bell, Check, CheckCircle2, Inbox, Trash2 } from 'lucide-react'
import { auth } from '@/core/auth/auth'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import {
  deleteNotificationAction,
  markAllNotificationsReadAction,
  markNotificationReadAction,
  markNotificationUnreadAction,
} from '@/features/notifications/actions'
import { notificationQueries } from '@/features/notifications/queries'
import { NotificationModule, NotificationStatus, notificationModuleSchema, notificationStatusSchema } from '@/features/notifications/schemas'

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

const statusTabs: { label: string; value: NotificationStatus }[] = [
  { label: 'Semua', value: 'all' },
  { label: 'Belum Dibaca', value: 'unread' },
  { label: 'Sudah Dibaca', value: 'read' },
  { label: 'Arsip', value: 'archived' },
]

const moduleFilters: { label: string; value: NotificationModule }[] = [
  { label: 'Semua', value: 'all' },
  { label: 'Sistem', value: 'system' },
  { label: 'Keuangan', value: 'finance' },
  { label: 'LPJ', value: 'lpj' },
  { label: 'CMS', value: 'cms' },
  { label: 'Persuratan', value: 'letters' },
  { label: 'Pengumuman', value: 'announcement' },
]

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

async function markAllReadFormAction() {
  'use server'
  await markAllNotificationsReadAction()
}

async function markReadFormAction(id: string) {
  'use server'
  await markNotificationReadAction(id)
}

async function markUnreadFormAction(id: string) {
  'use server'
  await markNotificationUnreadAction(id)
}

async function deleteNotificationFormAction(id: string) {
  'use server'
  await deleteNotificationAction(id)
}

export default async function AdminNotificationsPage({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {}
  const status = notificationStatusSchema.catch('all').parse(firstParam(params.status))
  const selectedModule = notificationModuleSchema.catch('all').parse(firstParam(params.module))
  const session = await auth()
  const notifications = session?.user.id
    ? await notificationQueries.getUserNotifications(session.user.id, 0, 60, status, selectedModule)
    : []
  const unreadCount = session?.user.id ? await notificationQueries.getUnreadCount(session.user.id) : 0

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-extrabold text-primary">Notifikasi</h1>
          <p className="mt-1 text-sm text-muted">Inbox notifikasi sistem dan aktivitas internal.</p>
        </div>
        <form action={markAllReadFormAction}>
          <Button type="submit" variant="outline" size="sm">
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            Tandai Semua Dibaca
          </Button>
        </form>
      </div>

      <div className="flex flex-wrap gap-2">
        {statusTabs.map((tab) => (
          <Link
            key={tab.value}
            href={`/admin/notifications?status=${tab.value}&module=${selectedModule}`}
            className={`rounded-full px-4 py-2 text-sm font-semibold ring-1 ring-line ${status === tab.value ? 'bg-primary text-surface' : 'bg-surface text-primary'}`}
          >
            {tab.label}
            {tab.value === 'unread' && unreadCount > 0 ? (
              <span className="ml-1.5 rounded-full bg-accent px-1.5 py-0.5 text-[11px] font-bold text-white">
                {unreadCount}
              </span>
            ) : null}
          </Link>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {moduleFilters.map((filter) => (
          <Link
            key={filter.value}
            href={`/admin/notifications?status=${status}&module=${filter.value}`}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-line ${selectedModule === filter.value ? 'bg-accent text-surface' : 'bg-surface text-primary'}`}
          >
            {filter.label}
          </Link>
        ))}
      </div>

      {notifications.length === 0 ? (
        <Card>
          <EmptyState icon={Bell} title="Tidak ada notifikasi" description="Notifikasi dari sistem akan tampil di sini." />
        </Card>
      ) : (
        <div className="grid gap-3">
          {notifications.map((notification) => (
            <Card key={notification.id}>
              <CardContent className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-heading font-bold text-primary">{notification.title}</h3>
                    <Badge tone={notification.deletedAt ? 'warning' : notification.readAt ? 'surface' : 'accent'}>
                      {notification.deletedAt ? 'Arsip' : notification.readAt ? 'Dibaca' : 'Baru'}
                    </Badge>
                    <Badge tone="surface">{notification.type}</Badge>
                  </div>
                  <p className="text-sm text-muted">{notification.message}</p>
                  <p className="text-xs font-medium text-muted">{notification.createdAt.toLocaleString('id-ID')}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {notification.actionUrl !== '#' ? (
                    <Link href={notification.actionUrl}>
                      <Button variant="secondary" size="sm">
                        <Inbox className="h-4 w-4" aria-hidden="true" />
                        Buka
                      </Button>
                    </Link>
                  ) : null}
                  {notification.readAt ? (
                    <form action={markUnreadFormAction.bind(null, notification.id)}>
                      <Button type="submit" variant="outline" size="sm">
                        <Inbox className="h-4 w-4" aria-hidden="true" />
                        Tandai Belum Dibaca
                      </Button>
                    </form>
                  ) : (
                    <form action={markReadFormAction.bind(null, notification.id)}>
                      <Button type="submit" variant="outline" size="sm">
                        <Check className="h-4 w-4" aria-hidden="true" />
                        Tandai Dibaca
                      </Button>
                    </form>
                  )}
                  {!notification.deletedAt ? (
                    <form action={deleteNotificationFormAction.bind(null, notification.id)}>
                      <Button type="submit" variant="danger" size="sm">
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                        Hapus
                      </Button>
                    </form>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
