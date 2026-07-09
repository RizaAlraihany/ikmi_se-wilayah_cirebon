'use client'

import { Badge } from '@/components/ui/badge'
import { Calendar, MapPin } from 'lucide-react'
import Link from 'next/link'

export function EventList({ events }: { events: { id: string, title: string, status: string, startDate: Date, endDate: Date, location: string }[] }) {
  if (events.length === 0) {
    return (
      <div className="text-center p-4 border border-dashed rounded-lg text-muted-foreground">
        Belum ada event yang direncanakan.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {events.map((event) => (
        <Link key={event.id} href={`/admin/events/${event.id}`}>
          <div className="p-3 border rounded-lg hover:bg-muted/50 transition-colors group">
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-semibold text-primary group-hover:underline">{event.title}</h4>
              <Badge tone={
                event.status === 'COMPLETED' ? 'success' : 
                event.status === 'ONGOING' ? 'primary' : 
                event.status === 'CANCELLED' ? 'danger' : 'surface'
              } className="text-[10px] px-1.5 py-0">
                {event.status}
              </Badge>
            </div>
            
            <div className="space-y-1 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                {new Date(event.startDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })} - {new Date(event.endDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" />
                {event.location}
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}
