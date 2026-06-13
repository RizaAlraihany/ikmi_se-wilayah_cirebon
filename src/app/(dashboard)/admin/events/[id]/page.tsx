import { eventQueries } from '@/features/events/queries'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Calendar, MapPin, FileText } from 'lucide-react'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import { StatusUpdater } from './components/StatusUpdater'
import { auth } from '@/core/auth/auth'

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const p = await params
  const [event, session] = await Promise.all([eventQueries.getEventById(p.id), auth()])

  if (!event) {
    notFound()
  }

  const showReportPanel = session?.user.roleId !== 'admin_sekretaris'

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-2">
        <Link href="/admin/events" className="text-muted-foreground hover:text-primary">
          &larr; Kembali
        </Link>
        <h1 className="font-heading text-3xl font-extrabold text-primary">Detail Event</h1>
      </div>

      <div className={showReportPanel ? 'grid gap-6 md:grid-cols-3' : 'grid gap-6'}>
        <div className={showReportPanel ? 'space-y-6 md:col-span-2' : 'space-y-6'}>
          <Card>
            <CardHeader className="pb-4">
              <div className="flex justify-between items-start">
                <div>
                  <Badge tone={event.status === 'COMPLETED' ? 'success' : event.status === 'CANCELLED' ? 'danger' : 'warning'} className="mb-2">
                    {event.status}
                  </Badge>
                  <CardTitle className="text-2xl">{event.title}</CardTitle>
                </div>
                <Badge tone="surface">{event.program?.name ?? '-'}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/20">
                  <Calendar className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Pelaksanaan</p>
                    <p className="text-sm font-semibold">
                      {format(new Date(event.startDate), 'dd MMM yyyy', { locale: localeId })} - {format(new Date(event.endDate), 'dd MMM yyyy', { locale: localeId })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/20">
                  <MapPin className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Lokasi</p>
                    <p className="text-sm font-semibold">{event.location}</p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Deskripsi</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{event.description}</p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Status Event</h4>
                <StatusUpdater eventId={event.id} currentStatus={event.status} />
              </div>
            </CardContent>
          </Card>
        </div>

        {showReportPanel ? (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  LPJ / Laporan
                </CardTitle>
              </CardHeader>
              <CardContent>
                {event.report ? (
                  <div className="p-3 border rounded-lg bg-muted/20">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-semibold">Status LPJ</span>
                      <Badge tone={event.report.status === 'VERIFIED' ? 'success' : 'warning'}>{event.report.status}</Badge>
                    </div>
                    <Link href={`/admin/reports/${event.report.id}`} className="text-sm text-primary hover:underline">
                      Lihat Detail Laporan
                    </Link>
                  </div>
                ) : (
                  <div className="text-center p-4 border border-dashed rounded-lg text-muted-foreground text-sm">
                    Belum ada laporan pertanggungjawaban.
                    {event.status === 'COMPLETED' && (
                      <div className="mt-3">
                        <Link href={`/admin/reports/new?eventId=${event.id}`} className="text-primary hover:underline font-medium">
                          Buat Laporan Sekarang
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : null}
      </div>
    </div>
  )
}
