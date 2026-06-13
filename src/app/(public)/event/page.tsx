import Link from 'next/link'
import { MapPin, CalendarDays, ArrowRight, Target } from 'lucide-react'
import { ButtonLink } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { prisma } from '@/core/database/prisma'

export const metadata = {
  title: 'Event dan Program Kerja - IKMI Cirebon',
  description: 'Daftar Event dan Program Kerja dari IKMI Cirebon.',
}

export const dynamic = 'force-dynamic'

export default async function KegiatanPage() {
  const events = await prisma.event.findMany({
    orderBy: { startDate: 'asc' },
    take: 10,
    where: { status: { in: ['UPCOMING', 'ONGOING'] }, deletedAt: null },
  })

  const programKerja = await prisma.program.findMany({
    include: { department: true },
    orderBy: { createdAt: 'desc' },
    take: 8,
    where: { deletedAt: null },
  })

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PLANNED': return 'Perencanaan'
      case 'ONGOING': return 'Berjalan'
      case 'COMPLETED': return 'Selesai'
      case 'CANCELLED': return 'Dibatalkan'
      default: return status
    }
  }

  const getStatusTone = (status: string): 'accent' | 'primary' | 'success' | 'warning' | 'danger' | 'surface' => {
    switch (status) {
      case 'PLANNED': return 'warning'
      case 'ONGOING': return 'success'
      case 'COMPLETED': return 'accent'
      case 'CANCELLED': return 'danger'
      default: return 'surface'
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <section className="bg-gradient-hero px-4 py-10 text-center md:px-6 md:py-16 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <p className="mb-3 flex items-center justify-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-surface/80 md:mb-4 md:gap-2 md:text-sm">
            <CalendarDays className="h-3.5 w-3.5 md:h-4 md:w-4" /> Jejak Langkah
          </p>
          <h1 className="font-heading text-3xl font-extrabold text-surface sm:text-5xl md:text-6xl">
            Event & Program Kerja
          </h1>
          <p className="mt-4 text-sm leading-6 text-surface/80 md:mt-6 md:text-lg md:leading-7">
            Aksi nyata IKMI Cirebon dalam mengembangkan potensi anggota dan memberikan dampak langsung kepada masyarakat.
          </p>
        </div>
      </section>

      <section className="px-4 py-8 md:px-6 md:py-16 lg:px-8">
        <div className="mx-auto max-w-[1200px]">
          <div className="mb-5 flex items-center gap-3 md:mb-8 md:gap-4">
            <div className="h-8 w-1.5 rounded-full bg-accent md:h-10 md:w-2" />
            <h2 className="font-heading text-xl font-extrabold text-primary md:text-3xl">Agenda Terdekat</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {events.length > 0 ? (
              events.map((agenda) => {
                const startDate = new Date(agenda.startDate)
                const month = startDate.toLocaleDateString('id-ID', { month: 'short' })
                const day = startDate.getDate()

                return (
                  <div
                    key={agenda.id}
                    className="flex flex-row gap-3 rounded-2xl bg-surface p-3 shadow-card ring-1 ring-border transition-shadow hover:shadow-soft md:gap-5 md:p-5"
                  >
                    <div className="flex h-14 w-14 flex-shrink-0 flex-col items-center justify-center rounded-xl bg-surface-alt text-center md:h-20 md:w-20 md:rounded-2xl">
                      <span className="text-[10px] font-bold uppercase text-text-secondary md:text-xs">
                        {month}
                      </span>
                      <span className="font-heading text-lg font-extrabold text-primary md:text-2xl">
                        {day}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1 space-y-1.5 md:space-y-2">
                      <Link href={`/event/${agenda.id}`} className="transition-colors hover:text-accent">
                        <p className="font-heading text-sm font-bold leading-snug text-primary md:text-xl">
                          {agenda.title}
                        </p>
                      </Link>
                      <p className="line-clamp-2 text-xs leading-5 text-text-secondary md:text-sm">
                        {agenda.description.replace(/<[^>]+>/g, '')}
                      </p>
                      <p className="flex items-center gap-1.5 border-t border-border pt-2 text-xs font-medium text-accent">
                        <MapPin className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
                        {agenda.location}
                      </p>
                    </div>
                  </div>
                )
              })
            ) : (
              <p className="col-span-2 text-sm italic text-text-secondary">Belum ada agenda terdekat.</p>
            )}
          </div>
        </div>
      </section>

      <section className="bg-surface-alt px-4 py-8 md:px-6 md:py-16 lg:px-8">
        <div className="mx-auto max-w-[1200px]">
          <div className="mb-5 flex items-center gap-3 md:mb-8 md:gap-4">
            <div className="h-8 w-1.5 rounded-full bg-primary md:h-10 md:w-2" />
            <h2 className="font-heading text-xl font-extrabold text-primary md:text-3xl">Program Kerja Unggulan</h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {programKerja.length > 0 ? (
              programKerja.map((proker) => (
                <div key={proker.id} className="flex flex-col justify-between rounded-2xl bg-surface p-4 shadow-card ring-1 ring-border transition-shadow hover:shadow-soft md:p-5">
                  <div className="space-y-3 md:space-y-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/5 text-primary md:h-12 md:w-12">
                      <Target className="h-5 w-5 md:h-6 md:w-6" />
                    </div>
                    <h3 className="font-heading text-base font-bold text-primary md:text-lg">{proker.name}</h3>
                    <p className="text-xs text-text-secondary md:text-sm">Dept. {proker.department.name}</p>
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t border-border pt-3 md:mt-6 md:pt-4">
                    <span className="text-[11px] font-bold uppercase tracking-wide text-primary/60 md:text-xs">Status</span>
                    <Badge tone={getStatusTone(proker.status)}>
                      {getStatusText(proker.status)}
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <p className="col-span-4 text-sm italic text-text-secondary">Belum ada program kerja terdaftar.</p>
            )}
          </div>
        </div>
      </section>

      <section className="bg-primary px-4 py-10 text-center md:px-6 md:py-16 lg:px-8">
        <div className="mx-auto max-w-[800px]">
          <h2 className="font-heading text-2xl font-extrabold text-surface md:text-5xl">
            Mari Berkontribusi Nyata
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-surface/80 md:mt-6 md:text-lg md:leading-7">
            Bergabunglah bersama kami dan jadilah bagian dari setiap program kerja dan agenda aksi nyata IKMI Cirebon.
          </p>
          <ButtonLink href="/gabung" className="mt-6 min-h-10 bg-surface px-6 text-sm !text-primary hover:bg-surface/90 md:mt-10 md:min-h-11 md:px-8 md:text-base">
            Gabung Bersama IKMI
            <ArrowRight className="ml-1 h-4 w-4 md:ml-2 md:h-5 md:w-5" />
          </ButtonLink>
        </div>
      </section>
    </main>
  )
}
