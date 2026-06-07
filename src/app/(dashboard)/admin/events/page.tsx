import { CalendarDays, MapPin } from 'lucide-react'
import { eventQueries } from '@/features/events/queries'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'

export default async function AdminEventsPage() {
  const events = await eventQueries.getEvents(undefined, 0, 20)

  return (
    <div className="space-y-6">
      <PageHeader title="Agenda & Program Kerja" description="Kelola jadwal kegiatan, status event, dan keterhubungan dengan program kerja." />
      {events.length === 0 ? (
        <Card>
          <EmptyState icon={CalendarDays} title="Belum ada agenda" description="Agenda dan program kerja departemen akan tampil di sini." />
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {events.map((event) => (
            <Card key={event.id}>
              <CardContent className="space-y-4 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-muted">{event.program.name}</p>
                    <h3 className="font-heading text-xl font-bold">{event.title}</h3>
                  </div>
                  <Badge tone={event.status === 'COMPLETED' ? 'success' : event.status === 'CANCELLED' ? 'danger' : 'warning'}>
                    {event.status}
                  </Badge>
                </div>
                <p className="text-sm leading-7 text-muted">{event.description}</p>
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
