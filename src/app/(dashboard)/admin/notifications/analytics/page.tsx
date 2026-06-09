import { Bell, CheckCircle2, Radio, TrendingUp } from 'lucide-react'
import { redirect } from 'next/navigation'
import { auth } from '@/core/auth/auth'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { canViewNotificationAnalytics } from '@/features/notifications/permissions'
import { notificationQueries } from '@/features/notifications/queries'

export const metadata = {
  title: 'Notification Analytics | IKMI Cirebon',
}

export default async function NotificationAnalyticsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const currentUser = {
    id: session.user.id,
    roleId: session.user.roleId,
    departmentId: session.user.departmentId,
    positionId: session.user.positionId,
  }

  if (!(await canViewNotificationAnalytics(currentUser))) {
    redirect('/dashboard/admin/notifications')
  }

  const analytics = await notificationQueries.getAnalytics()
  const kpis = [
    { label: 'Total Notification', value: analytics.total, icon: Bell },
    { label: 'Unread', value: analytics.unread, icon: Radio },
    { label: 'Read', value: analytics.read, icon: CheckCircle2 },
    { label: 'Response Rate', value: `${analytics.responseRate}%`, icon: TrendingUp },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-extrabold text-primary">Notification Analytics</h1>
        <p className="mt-1 text-sm text-muted">Pantau volume, keterbacaan, dan distribusi notifikasi per modul.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/8 text-primary">
                <kpi.icon className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-semibold text-muted">{kpi.label}</p>
                <p className="font-heading text-2xl font-extrabold text-primary">{kpi.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="grid gap-4 p-6 md:grid-cols-2">
          <Metric label="Delivery Rate" value={`${analytics.deliveryRate}%`} />
          <Metric label="Response Rate" value={`${analytics.responseRate}%`} />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="space-y-4 p-6">
            <h2 className="font-heading text-lg font-bold text-primary">Notification by Module</h2>
            <div className="space-y-3">
              {analytics.byModule.map((item) => (
                <div key={item.module} className="flex items-center justify-between rounded-2xl bg-background px-4 py-3">
                  <span className="font-semibold text-primary">{item.module}</span>
                  <Badge tone="accent">{item.count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4 p-6">
            <h2 className="font-heading text-lg font-bold text-primary">Notification by User</h2>
            <div className="space-y-3">
              {analytics.byUser.map((user) => (
                <div key={user.id} className="flex items-center justify-between rounded-2xl bg-background px-4 py-3">
                  <span className="font-semibold text-primary">{user.name}</span>
                  <Badge tone="primary">{user.count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="space-y-4 p-6">
          <h2 className="font-heading text-lg font-bold text-primary">Monthly Notifications</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
            {analytics.monthly.map((item) => (
              <div key={item.month} className="rounded-2xl bg-background p-4">
                <p className="text-sm font-semibold text-muted">{item.month}</p>
                <p className="mt-2 font-heading text-2xl font-extrabold text-primary">{item.count}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-background p-4">
      <p className="text-sm font-semibold text-muted">{label}</p>
      <p className="mt-2 font-heading text-2xl font-extrabold text-primary">{value}</p>
    </div>
  )
}
