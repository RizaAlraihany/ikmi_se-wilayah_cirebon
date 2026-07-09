import { notFound } from 'next/navigation'
import { MapPin, CalendarDays, ArrowLeft, Users } from 'lucide-react'
import { ButtonLink } from '@/components/ui/button'
import { prisma } from '@/core/database/prisma'
import { Badge } from '@/components/ui/badge'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const event = await prisma.event.findFirst({
    where: { id, deletedAt: null },
  })
  
  if (!event) {
    return { title: 'Event Tidak Ditemukan - IKMI Cirebon' }
  }

  return {
    title: `${event.title} - Event IKMI Cirebon`,
    description: event.description.substring(0, 160),
  }
}

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const event = await prisma.event.findFirst({
    where: { id, deletedAt: null },
    include: {
      program: {
        include: {
          department: true
        }
      }
    }
  })

  if (!event) {
    notFound()
  }

  const startDate = new Date(event.startDate)
  const endDate = new Date(event.endDate)
  
  const dateStr = startDate.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
  
  const timeStr = `${startDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} - ${endDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB`

  const getStatusColor = (status: string): 'surface' | 'warning' | 'success' | 'accent' | 'danger' => {
    switch (status) {
      case 'UPCOMING': return 'accent'
      case 'ONGOING': return 'success'
      case 'COMPLETED': return 'surface'
      case 'CANCELLED': return 'danger'
      default: return 'surface'
    }
  }

  return (
    <main className="min-h-screen bg-background pb-12 md:pb-20">
      {/* ─── BREADCRUMB & HEADER ─────────────────────────────────────────── */}
      <section className="public-hero px-4 pb-16 pt-12 md:px-6 md:pb-20 md:pt-[4.5rem] lg:px-8">
        <div className="mx-auto max-w-[800px]">
          <ButtonLink 
            href="/event" 
            variant="ghost" 
            className="mb-5 min-h-9 px-3 text-xs text-surface/70 hover:bg-surface/10 hover:text-surface md:mb-8 md:-ml-4 md:min-h-11 md:text-sm"
          >
            <ArrowLeft className="mr-1 h-3.5 w-3.5 md:mr-2 md:h-4 md:w-4" /> Kembali ke Event
          </ButtonLink>
          
          <div className="space-y-4 text-center md:space-y-6 md:text-left">
            <div className="flex flex-wrap gap-2 justify-center md:justify-start">
              <Badge tone={getStatusColor(event.status)}>
                {event.status}
              </Badge>
              {event.program && (
                <Badge tone="accent">
                  Program: {event.program.name}
                </Badge>
              )}
            </div>
            
            <h1 className="font-heading text-2xl font-extrabold leading-tight text-surface sm:text-4xl md:text-5xl">
              {event.title}
            </h1>
          </div>
        </div>
      </section>

      {/* ─── CONTENT ─────────────────────────────────────────────────────── */}
      <section className="-mt-7 px-4 pb-8 pt-2 md:-mt-10 md:px-6 md:pb-12 md:pt-3 lg:px-8">
        <div className="mx-auto max-w-[800px]">
          <div className="space-y-6 rounded-2xl bg-surface p-4 shadow-soft ring-1 ring-border/70 md:space-y-8 md:p-8">
            
            {/* Info Cards */}
            <div className="grid gap-3 sm:grid-cols-2 md:gap-4">
              <div className="flex items-start gap-3 rounded-2xl bg-surface-alt p-3 ring-1 ring-border/70 md:gap-4 md:p-4">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary md:h-12 md:w-12">
                  <CalendarDays className="h-5 w-5 md:h-6 md:w-6" />
                </div>
                <div>
                  <p className="mb-1 text-[11px] font-bold uppercase text-text-secondary md:text-xs">Waktu Pelaksanaan</p>
                  <p className="text-xs font-semibold text-primary md:text-sm">{dateStr}</p>
                  <p className="mt-0.5 text-[11px] text-text-secondary md:text-xs">{timeStr}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-2xl bg-surface-alt p-3 ring-1 ring-border/70 md:gap-4 md:p-4">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent md:h-12 md:w-12">
                  <MapPin className="h-5 w-5 md:h-6 md:w-6" />
                </div>
                <div>
                  <p className="mb-1 text-[11px] font-bold uppercase text-text-secondary md:text-xs">Lokasi</p>
                  <p className="text-xs font-semibold text-primary md:text-sm">{event.location}</p>
                </div>
              </div>
              {event.program?.department && (
                <div className="flex items-start gap-3 rounded-2xl bg-surface-alt p-3 ring-1 ring-border/70 sm:col-span-2 md:gap-4 md:p-4">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-success text-success-foreground md:h-12 md:w-12">
                    <Users className="h-5 w-5 md:h-6 md:w-6" />
                  </div>
                  <div>
                    <p className="mb-1 text-[11px] font-bold uppercase text-text-secondary md:text-xs">Penyelenggara</p>
                    <p className="text-xs font-semibold text-primary md:text-sm">Departemen {event.program.department.name}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Description */}
            <div className="space-y-3 md:space-y-4">
              <h2 className="font-heading text-lg font-bold text-primary md:text-xl">
                Deskripsi Event
              </h2>
              <div 
                className="prose prose-sm max-w-none leading-relaxed text-text-secondary md:prose-base"
                dangerouslySetInnerHTML={{ __html: event.description }}
              />
            </div>

          </div>
        </div>
      </section>
    </main>
  )
}
