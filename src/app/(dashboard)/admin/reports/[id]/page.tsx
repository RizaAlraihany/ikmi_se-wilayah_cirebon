import { reportQueries } from '@/features/reports/queries'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { FileText, MapPin, CalendarDays, ExternalLink } from 'lucide-react'
import { ReportActions } from './components/ReportActions'
import { auth } from '@/core/auth/auth'
import { can, type SessionUser } from '@/core/authorization/rbac'

export default async function ReportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const p = await params
  const report = await reportQueries.getReportById(p.id)
  const session = await auth()
  const user = session?.user ? {
    id: session.user.id!,
    roleId: (session.user as { roleId: string }).roleId,
    departmentId: session.user.departmentId ?? null,
    positionId: null,
  } satisfies SessionUser : null

  if (!report) {
    notFound()
  }

  const canVerify = await can('lpj.verify', user)

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-2">
        <Link href="/admin/reports" className="text-muted-foreground hover:text-primary">
          &larr; Kembali
        </Link>
        <h1 className="font-heading text-3xl font-extrabold text-primary">Detail LPJ</h1>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex justify-between items-start">
            <div>
              <Badge tone={report.status === 'VERIFIED' ? 'success' : report.status === 'REJECTED' ? 'danger' : 'warning'} className="mb-2">
                {report.status}
              </Badge>
              <CardTitle className="text-2xl">{report.event?.title ?? 'Event Tidak Diketahui'}</CardTitle>
            </div>
            <Badge tone="surface">{report.event?.program?.name ?? '-'}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/20">
              <CalendarDays className="w-5 h-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Dilaksanakan</p>
                <p className="text-sm font-semibold">
                  {report.event?.startDate ? new Date(report.event.startDate).toLocaleDateString('id-ID') : '-'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/20">
              <MapPin className="w-5 h-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Lokasi</p>
                <p className="text-sm font-semibold">{report.event?.location ?? '-'}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg bg-primary/5">
            <div className="flex items-center gap-3">
              <FileText className="w-6 h-6 text-primary" />
              <div>
                <p className="font-medium text-primary">Dokumen LPJ</p>
                <p className="text-xs text-muted-foreground break-all">{report.documentUrl}</p>
              </div>
            </div>
            <a href={report.documentUrl} target="_blank" rel="noreferrer" className="flex items-center text-sm font-medium text-primary hover:underline">
              Buka <ExternalLink className="w-4 h-4 ml-1" />
            </a>
          </div>

          <div className="pt-4 border-t">
            <h4 className="font-semibold mb-4">Verifikasi LPJ</h4>
            <ReportActions
              reportId={report.id}
              status={report.status}
              canVerify={canVerify}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
