import Link from 'next/link'
import { MapPin, CalendarDays, ArrowRight, Target } from 'lucide-react'
import { ButtonLink } from '@/components/ui/button'
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
    where: { status: { in: ['UPCOMING', 'ONGOING'] }, deletedAt: null }
  })

  const programKerja = await prisma.program.findMany({
    include: { department: true },
    orderBy: { createdAt: 'desc' },
    take: 8,
    where: { deletedAt: null },
  })

  // Format Status for Programs
  const getStatusText = (status: string) => {
    switch (status) {
      case 'PLANNED': return 'Perencanaan'
      case 'ONGOING': return 'Berjalan'
      case 'COMPLETED': return 'Selesai'
      case 'CANCELLED': return 'Dibatalkan'
      default: return status
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PLANNED': return 'bg-amber-100 text-amber-700'
      case 'ONGOING': return 'bg-green-100 text-green-700'
      case 'COMPLETED': return 'bg-blue-100 text-blue-700'
      case 'CANCELLED': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <main className="bg-background min-h-screen">
      {/* ─── HEADER ──────────────────────────────────────────────────────── */}
      <section className="bg-primary px-4 py-20 text-center md:px-6 md:py-28 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <p className="text-sm font-bold uppercase tracking-widest text-accent mb-4 flex items-center justify-center gap-2">
            <CalendarDays className="h-4 w-4" /> Jejak Langkah
          </p>
          <h1 className="font-heading text-4xl font-extrabold text-surface sm:text-5xl md:text-6xl">
            Event & Program Kerja
          </h1>
          <p className="mt-6 text-base leading-relaxed text-surface/80 md:text-lg">
            Aksi nyata IKMI Cirebon dalam mengembangkan potensi anggota dan memberikan dampak 
            langsung kepada masyarakat.
          </p>
        </div>
      </section>

      {/* ─── EVENT / AGENDA ──────────────────────────────────────────────── */}
      <section className="px-4 py-16 md:px-6 md:py-24 lg:px-8">
        <div className="mx-auto max-w-[1200px]">
          <div className="mb-12 flex items-center gap-4">
            <div className="h-10 w-2 bg-accent rounded-full" />
            <h2 className="font-heading text-3xl font-extrabold text-primary">Agenda Terdekat</h2>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2">
            {events.length > 0 ? (
              events.map((agenda) => {
                const startDate = new Date(agenda.startDate)
                const month = startDate.toLocaleDateString('id-ID', { month: 'short' })
                const day = startDate.getDate()

                return (
                  <div
                    key={agenda.id}
                    className="flex flex-col sm:flex-row gap-5 rounded-2xl bg-surface p-6 shadow-[0_4px_20px_rgba(0,0,0,0.05)] ring-1 ring-line transition-shadow hover:shadow-[0_8px_30px_rgba(0,0,0,0.1)]"
                  >
                    <div className="flex h-20 w-20 flex-shrink-0 flex-col items-center justify-center rounded-2xl bg-primary/8 text-center">
                      <span className="text-xs font-bold uppercase text-muted">
                        {month}
                      </span>
                      <span className="font-heading text-2xl font-extrabold text-primary">
                        {day}
                      </span>
                    </div>
                    <div className="space-y-2 min-w-0 flex-1">
                      <Link href={`/event/${agenda.id}`} className="hover:text-accent transition-colors">
                        <p className="font-heading text-xl font-bold text-primary leading-snug">
                          {agenda.title}
                        </p>
                      </Link>
                      <p className="text-sm text-muted line-clamp-2">
                        {agenda.description.replace(/<[^>]+>/g, '')}
                      </p>
                      <p className="flex items-center gap-1.5 text-xs font-medium text-accent pt-2 border-t border-line">
                        <MapPin className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
                        {agenda.location}
                      </p>
                    </div>
                  </div>
                )
              })
            ) : (
              <p className="text-muted text-sm italic col-span-2">Belum ada agenda terdekat.</p>
            )}
          </div>
        </div>
      </section>

      {/* ─── PROGRAM KERJA ───────────────────────────────────────────────── */}
      <section className="bg-background-warm px-4 py-16 md:px-6 md:py-24 lg:px-8">
        <div className="mx-auto max-w-[1200px]">
          <div className="mb-12 flex items-center gap-4">
            <div className="h-10 w-2 bg-primary rounded-full" />
            <h2 className="font-heading text-3xl font-extrabold text-primary">Program Kerja Unggulan</h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {programKerja.length > 0 ? (
              programKerja.map((proker) => (
                <div key={proker.id} className="bg-surface rounded-2xl p-6 ring-1 ring-line flex flex-col justify-between hover:shadow-md transition-shadow">
                  <div className="space-y-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/5 text-primary">
                      <Target className="h-6 w-6" />
                    </div>
                    <h3 className="font-heading text-lg font-bold text-primary">{proker.name}</h3>
                    <p className="text-sm text-muted">Dept. {proker.department.name}</p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-line flex justify-between items-center">
                    <span className="text-xs font-bold uppercase tracking-wide text-primary/60">Status</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(proker.status)}`}>
                      {getStatusText(proker.status)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted text-sm italic col-span-4">Belum ada program kerja terdaftar.</p>
            )}
          </div>
        </div>
      </section>

      {/* ─── CTA KONVERSI ────────────────────────────────────────────────── */}
      <section className="bg-primary px-4 py-20 md:px-6 md:py-28 lg:px-8 text-center">
        <div className="mx-auto max-w-[800px]">
          <h2 className="font-heading text-3xl font-extrabold text-surface md:text-5xl">
            Mari Berkontribusi Nyata
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-surface/80 md:text-lg">
            Bergabunglah bersama kami dan jadilah bagian dari setiap program kerja dan agenda aksi nyata IKMI Cirebon.
          </p>
          <ButtonLink 
            href="/gabung" 
            className="mt-10 bg-surface !text-primary hover:bg-surface/90 px-8 py-3 text-base"
          >
            Gabung Bersama IKMI
            <ArrowRight className="ml-2 h-5 w-5" />
          </ButtonLink>
        </div>
      </section>
    </main>
  )
}
