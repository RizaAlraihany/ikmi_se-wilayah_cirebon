import { auth } from '@/core/auth/auth'
import { redirect } from 'next/navigation'
import { LPJStatus } from '@prisma/client'
import { FileText } from 'lucide-react'
import { eventQueries } from '@/features/events/queries'
import { reportQueries } from '@/features/reports/queries'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { LpjForm } from './components/LpjForm'
import { LpjViewer } from './components/LpjViewer'

export const metadata = {
  title: 'Manajemen LPJ | IKMI Cirebon',
}

function getReportStatusTone(status: LPJStatus): React.ComponentProps<typeof Badge>['tone'] {
  switch (status) {
    case 'SUBMITTED':
      return 'warning'
    case 'VERIFIED_DEPARTMENT':
      return 'accent'
    case 'VERIFIED_BPH':
      return 'success'
    case 'REJECTED':
      return 'danger'
  }
  return 'surface'
}

export default async function ReportsPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const isSuperAdmin = session.user.roleId === 'super_admin'
  const departmentId = isSuperAdmin ? undefined : session.user.departmentId

  const reports = await reportQueries.getReports(departmentId)
  const upcomingEvents = await eventQueries.getEventsWithoutReport(departmentId)

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6">
      <div>
        <h1 className="font-heading text-2xl font-extrabold text-primary">Manajemen LPJ</h1>
        <p className="mt-1 text-sm text-muted">Kelola dan tinjau laporan pertanggungjawaban kegiatan.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {reports.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="Belum ada LPJ"
              description="LPJ yang disubmit pengurus akan muncul di sini."
            />
          ) : (
            <>
              <div className="grid gap-4 md:hidden">
                {reports.map((report) => (
                  <Card key={report.id}>
                    <CardContent className="space-y-4 p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-heading text-base font-bold text-primary">{report.event.title}</p>
                          <p className="text-sm text-muted">{report.event.program.name}</p>
                        </div>
                        <Badge tone={getReportStatusTone(report.status)}>{report.status}</Badge>
                      </div>
                      <LpjViewer url={report.documentUrl} title={report.event.title} />
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card className="hidden overflow-hidden md:block">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-background text-xs font-semibold uppercase tracking-wide text-muted">
                      <tr>
                        <th className="px-5 py-4">Event</th>
                        <th className="px-5 py-4">Status</th>
                        <th className="px-5 py-4 text-right">Dokumen</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {reports.map((report) => (
                        <tr key={report.id} className="transition-colors hover:bg-background">
                          <td className="px-5 py-4">
                            <span className="block font-semibold text-primary">{report.event.title}</span>
                            <span className="block text-xs text-muted">{report.event.program.name}</span>
                          </td>
                          <td className="px-5 py-4">
                            <Badge tone={getReportStatusTone(report.status)}>{report.status}</Badge>
                          </td>
                          <td className="px-5 py-4 text-right">
                            <LpjViewer url={report.documentUrl} title={report.event.title} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </>
          )}
        </div>

        <div>
          <LpjForm events={upcomingEvents} />
        </div>
      </div>
    </div>
  )
}
