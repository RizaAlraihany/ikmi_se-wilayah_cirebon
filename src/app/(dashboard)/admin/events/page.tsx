import { CalendarDays, MapPin, Activity, CheckCircle2 } from 'lucide-react'
import { eventQueries } from '@/features/events/queries'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function AdminEventsPage() {
  const allEvents = await eventQueries.getEvents(undefined, 0, 100)
  
  const upcomingEvents = allEvents.filter(e => e.status === 'UPCOMING')
  const ongoingEvents = allEvents.filter(e => e.status === 'ONGOING')
  const completedEvents = allEvents.filter(e => e.status === 'COMPLETED')

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <PageHeader title="Agenda & Program Kerja" description="Kelola jadwal kegiatan, status event, dan keterhubungan dengan program kerja." />
        <Link href="/admin/events/new">
          <Button>
            <CalendarDays className="w-4 h-4 mr-2" />
            Event Baru
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="border-t-4 border-t-accent">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium uppercase text-text-secondary">
              <CalendarDays className="w-4 h-4" /> Upcoming
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{upcomingEvents.length}</div>
            <p className="mt-1 text-xs text-text-secondary">Agenda mendatang</p>
          </CardContent>
        </Card>
        
        <Card className="border-t-4 border-t-primary">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium uppercase text-text-secondary">
              <Activity className="w-4 h-4" /> Ongoing
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{ongoingEvents.length}</div>
            <p className="mt-1 text-xs text-text-secondary">Sedang berlangsung</p>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-success">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium uppercase text-text-secondary">
              <CheckCircle2 className="w-4 h-4" /> Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{completedEvents.length}</div>
            <p className="mt-1 text-xs text-text-secondary">Telah selesai</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h2 className="border-b border-border pb-2 font-heading text-xl font-bold text-primary">Semua Event</h2>
        {allEvents.length === 0 ? (
          <Card>
            <EmptyState icon={CalendarDays} title="Belum ada agenda" description="Agenda dan program kerja departemen akan tampil di sini." />
          </Card>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {allEvents.map((event) => (
              <Link key={event.id} href={`/admin/events/${event.id}`} className="block">
                <Card className="h-full transition-colors hover:bg-surface-alt">
                  <CardContent className="space-y-4 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-text-secondary">{event.program?.name ?? '-'}</p>
                        <h3 className="font-heading text-xl font-bold">{event.title}</h3>
                      </div>
                      <Badge tone={event.status === 'COMPLETED' ? 'success' : event.status === 'CANCELLED' ? 'danger' : event.status === 'ONGOING' ? 'primary' : 'warning'}>
                        {event.status}
                      </Badge>
                    </div>
                    <p className="line-clamp-2 text-sm leading-7 text-text-secondary">{event.description}</p>
                    <div className="flex flex-wrap gap-3 text-sm font-medium text-primary">
                      <span className="inline-flex items-center gap-2">
                        <CalendarDays className="h-4 w-4 text-accent" aria-hidden="true" />
                        {new Date(event.startDate).toLocaleDateString('id-ID')}
                      </span>
                      <span className="inline-flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-accent" aria-hidden="true" />
                        {event.location}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function PageHeader({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <h1 className="font-heading text-3xl font-extrabold text-primary">{title}</h1>
      <p className="mt-1 text-sm text-text-secondary">{description}</p>
    </div>
  )
}
