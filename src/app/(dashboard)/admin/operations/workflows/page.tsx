import { Activity, AlertTriangle, CheckCircle2, Clock, Loader2 } from 'lucide-react'
import { redirect } from 'next/navigation'
import { auth } from '@/core/auth/auth'
import { Card, CardContent } from '@/components/ui/card'
import { notificationQueries } from '@/features/notifications/queries'
import { canViewNotificationAnalytics } from '@/features/notifications/permissions'

export const metadata = {
  title: 'Workflow Monitoring | IKMI Cirebon',
}

export default async function WorkflowMonitoringPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const currentUser = {
    id: session.user.id,
    roleId: session.user.roleId,
    departmentId: session.user.departmentId,
    positionId: session.user.positionId,
  }

  if (!(await canViewNotificationAnalytics(currentUser))) {
    redirect('/dashboard/admin')
  }

  const workflows = await notificationQueries.getWorkflowMonitoring()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-extrabold text-primary">Workflow Monitoring</h1>
        <p className="mt-1 text-sm text-muted">Pantau status workflow utama lintas membership, finance, LPJ, dan CMS.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {workflows.map((workflow) => (
          <Card key={workflow.module}>
            <CardContent className="space-y-5 p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/8 text-primary">
                  <Activity className="h-5 w-5" aria-hidden="true" />
                </div>
                <h2 className="font-heading text-xl font-bold text-primary">{workflow.module} Workflow</h2>
              </div>
              <div className="grid gap-3 sm:grid-cols-4">
                <WorkflowMetric icon={Clock} label="Pending" value={workflow.pending} />
                <WorkflowMetric icon={Loader2} label="In Progress" value={workflow.inProgress} />
                <WorkflowMetric icon={CheckCircle2} label="Completed" value={workflow.completed} />
                <WorkflowMetric icon={AlertTriangle} label="Failed" value={workflow.failed} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

function WorkflowMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Clock
  label: string
  value: number
}) {
  return (
    <div className="rounded-2xl bg-background p-4">
      <Icon className="h-4 w-4 text-accent" aria-hidden="true" />
      <p className="mt-3 text-xs font-semibold text-muted">{label}</p>
      <p className="mt-1 font-heading text-2xl font-extrabold text-primary">{value}</p>
    </div>
  )
}
