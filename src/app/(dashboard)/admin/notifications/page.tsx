import { Bell } from 'lucide-react'
import { auth } from '@/core/auth/auth'
import { notificationQueries } from '@/features/notifications/queries'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'

export default async function AdminNotificationsPage() {
  const session = await auth()
  const notifications = session?.user.id
    ? await notificationQueries.getUserNotifications(session.user.id, 0, 40)
    : []

  return (
    <div className="space-y-6">
      <PageHeader title="Notifikasi" description="Pusat pemberitahuan internal untuk aktivitas organisasi." />
      {notifications.length === 0 ? (
        <Card>
          <EmptyState icon={Bell} title="Tidak ada notifikasi" description="Notifikasi dari workflow sistem akan tampil di halaman ini." />
        </Card>
      ) : (
        <div className="grid gap-3">
          {notifications.map((notification) => (
            <Card key={notification.id}>
              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="font-heading font-bold">{notification.title}</h3>
                  <p className="text-sm text-muted">{notification.message}</p>
                </div>
                <Badge tone={notification.readAt ? 'surface' : 'accent'}>
                  {notification.readAt ? 'Dibaca' : 'Baru'}
                </Badge>
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
