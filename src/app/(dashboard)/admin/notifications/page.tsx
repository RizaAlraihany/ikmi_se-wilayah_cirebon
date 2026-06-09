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
  { label: 'Unread', value: 'unread' },
  { label: 'Read', value: 'read' },
  { label: 'Archived', value: 'archived' },
]

const moduleFilters: { label: string; value: NotificationModule }[] = [
  { label: 'All', value: 'all' },
  { label: 'System', value: 'system' },
  { label: 'Workflow', value: 'workflow' },
  { label: 'Membership', value: 'membership' },
  { label: 'Finance', value: 'finance' },
  { label: 'LPJ', value: 'lpj' },
  { label: 'CMS', value: 'cms' },
  { label: 'Letters', value: 'letters' },
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
        <PageHeader title="Notification Center" description="Inbox workflow internal untuk aktivitas sistem dan otomasi operasional." />
        <div className="flex flex-wrap gap-2">
          <form action={markAllReadFormAction}>
            <Button type="submit" variant="outline" size="sm">
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              Mark All Read
            </Button>
          </form>
          <Link href="/dashboard/admin/notifications/analytics">
            <Button variant="secondary" size="sm">Analytics</Button>
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {statusTabs.map((tab) => (
          <Link
            key={tab.value}
            href={`/dashboard/admin/notifications?status=${tab.value}&module=${selectedModule}`}
            className={`rounded-full px-4 py-2 text-sm font-semibold ring-1 ring-line ${status === tab.value ? 'bg-primary text-surface' : 'bg-surface text-primary'}`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {moduleFilters.map((filter) => (
          <Link
            key={filter.value}
            href={`/dashboard/admin/notifications?status=${status}&module=${filter.value}`}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-line ${selectedModule === filter.value ? 'bg-accent text-surface' : 'bg-surface text-primary'}`}
          >
            {filter.label}
          </Link>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Metric label="Unread" value={unreadCount} />
        <Metric label="Visible Items" value={notifications.length} />
        <Metric label="Filter" value={selectedModule.toUpperCase()} />
      </div>

      {notifications.length === 0 ? (
        <Card>
          <EmptyState icon={Bell} title="Tidak ada notifikasi" description="Notifikasi dari workflow sistem akan tampil di halaman ini." />
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
                      {notification.deletedAt ? 'Archived' : notification.readAt ? 'Read' : 'Unread'}
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
                        Open
                      </Button>
                    </Link>
                  ) : null}
                  {notification.readAt ? (
                    <form action={markUnreadFormAction.bind(null, notification.id)}>
                      <Button type="submit" variant="outline" size="sm">
                        <Inbox className="h-4 w-4" aria-hidden="true" />
                        Mark Unread
                      </Button>
                    </form>
                  ) : (
                    <form action={markReadFormAction.bind(null, notification.id)}>
                      <Button type="submit" variant="outline" size="sm">
                        <Check className="h-4 w-4" aria-hidden="true" />
                        Mark Read
                      </Button>
                    </form>
                  )}
                  {!notification.deletedAt ? (
                    <form action={deleteNotificationFormAction.bind(null, notification.id)}>
                      <Button type="submit" variant="danger" size="sm">
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                        Delete
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

function PageHeader({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <h1 className="font-heading text-3xl font-extrabold text-primary">{title}</h1>
      <p className="mt-1 text-sm text-muted">{description}</p>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: number | string }) {
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-sm font-semibold text-muted">{label}</p>
        <p className="mt-2 font-heading text-2xl font-extrabold text-primary">{value}</p>
      </CardContent>
    </Card>
  )
}
