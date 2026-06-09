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
    <main className="bg-background min-h-screen pb-20">
      {/* ─── BREADCRUMB & HEADER ─────────────────────────────────────────── */}
      <section className="bg-primary px-4 pb-16 pt-24 md:px-6 lg:px-8">
        <div className="mx-auto max-w-[800px]">
          <ButtonLink 
            href="/event" 
            variant="ghost" 
            className="mb-8 -ml-4 text-surface/70 hover:text-surface hover:bg-surface/10"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Kembali ke Event
          </ButtonLink>
          
          <div className="space-y-6 text-center md:text-left">
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
            
            <h1 className="font-heading text-3xl font-extrabold text-surface sm:text-4xl md:text-5xl leading-tight">
              {event.title}
            </h1>
          </div>
        </div>
      </section>

      {/* ─── CONTENT ─────────────────────────────────────────────────────── */}
      <section className="px-4 py-12 md:px-6 lg:px-8 -mt-8">
        <div className="mx-auto max-w-[800px]">
          <div className="bg-surface rounded-3xl p-6 md:p-10 shadow-[0_8px_30px_rgba(0,0,0,0.08)] ring-1 ring-line space-y-10">
            
            {/* Info Cards */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-start gap-4 p-4 rounded-2xl bg-background-warm border border-line">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary flex-shrink-0">
                  <CalendarDays className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase text-muted mb-1">Waktu Pelaksanaan</p>
                  <p className="text-sm font-semibold text-primary">{dateStr}</p>
                  <p className="text-xs text-muted mt-0.5">{timeStr}</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 rounded-2xl bg-background-warm border border-line">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent flex-shrink-0">
                  <MapPin className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase text-muted mb-1">Lokasi</p>
                  <p className="text-sm font-semibold text-primary">{event.location}</p>
                </div>
              </div>
              {event.program?.department && (
                <div className="flex items-start gap-4 p-4 rounded-2xl bg-background-warm border border-line sm:col-span-2">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-green-700 flex-shrink-0">
                    <Users className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase text-muted mb-1">Penyelenggara</p>
                    <p className="text-sm font-semibold text-primary">Departemen {event.program.department.name}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Description */}
            <div className="space-y-4">
              <h2 className="font-heading text-xl font-bold text-primary border-b border-line pb-2">
                Deskripsi Event
              </h2>
              <div 
                className="prose prose-sm md:prose-base prose-primary max-w-none text-muted leading-relaxed"
                dangerouslySetInnerHTML={{ __html: event.description }}
              />
            </div>

          </div>
        </div>
      </section>
    </main>
  )
}
