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
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <PageHeader title="Agenda & Program Kerja" description="Kelola jadwal kegiatan, status event, dan keterhubungan dengan program kerja." />
        <Link href="/admin/events/new">
          <Button>
            <CalendarDays className="w-4 h-4 mr-2" />
            Event Baru
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-t-4 border-t-accent">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase flex items-center gap-2">
              <CalendarDays className="w-4 h-4" /> Upcoming
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{upcomingEvents.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Agenda mendatang</p>
          </CardContent>
        </Card>
        
        <Card className="border-t-4 border-t-primary">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase flex items-center gap-2">
              <Activity className="w-4 h-4" /> Ongoing
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{ongoingEvents.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Sedang berlangsung</p>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-green-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{completedEvents.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Telah selesai</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-bold border-b pb-2">Semua Event</h2>
        {allEvents.length === 0 ? (
          <Card>
            <EmptyState icon={CalendarDays} title="Belum ada agenda" description="Agenda dan program kerja departemen akan tampil di sini." />
          </Card>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {allEvents.map((event) => (
              <Link key={event.id} href={`/admin/events/${event.id}`} className="block">
                <Card className="hover:bg-muted/50 transition-colors h-full">
                  <CardContent className="space-y-4 p-5">
                    <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-muted">{event.program.name}</p>
                      <h3 className="font-heading text-xl font-bold">{event.title}</h3>
                    </div>
                    <Badge tone={event.status === 'COMPLETED' ? 'success' : event.status === 'CANCELLED' ? 'danger' : event.status === 'ONGOING' ? 'primary' : 'warning'}>
                      {event.status}
                    </Badge>
                  </div>
                  <p className="text-sm leading-7 text-muted line-clamp-2">{event.description}</p>
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
      <p className="mt-1 text-sm text-muted">{description}</p>
    </div>
  )
}
