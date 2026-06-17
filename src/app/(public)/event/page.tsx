import Link from 'next/link'
import {
  Calendar,
  CheckCircle,
  Clock,
  MapPin,
  PlayCircle,
  Star,
  Tag,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { prisma } from '@/core/database/prisma'
import { defaultWebConfig } from '@/features/web-config/default-config'

export const metadata = {
  title: 'Event dan Program Kerja - IKMI Cirebon',
  description: 'Daftar Event dan Program Kerja dari IKMI Cirebon.',
}

export const dynamic = 'force-dynamic'

function getStatusText(status: string) {
  switch (status) {
    case 'PLANNED':
      return 'Perencanaan'
    case 'ONGOING':
      return 'Berjalan'
    case 'COMPLETED':
      return 'Selesai'
    case 'CANCELLED':
      return 'Dibatalkan'
    default:
      return status
  }
}

function getStatusTone(status: string): 'accent' | 'primary' | 'success' | 'warning' | 'danger' | 'surface' {
  switch (status) {
    case 'PLANNED':
      return 'warning'
    case 'ONGOING':
      return 'success'
    case 'COMPLETED':
      return 'accent'
    case 'CANCELLED':
      return 'danger'
    default:
      return 'surface'
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'ONGOING':
      return PlayCircle
    case 'COMPLETED':
      return CheckCircle
    default:
      return Clock
  }
}

function stripHtml(value: string) {
  return value.replace(/<[^>]+>/g, '').trim()
}

function formatEventDate(date: Date) {
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

function formatBudget(value: unknown) {
  const amount = Number(value ?? 0)
  if (!Number.isFinite(amount) || amount <= 0) return 'Belum ditentukan'

  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount)
}

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

  const heroImage =
    defaultWebConfig.landing_hero.slides?.[1]?.url ??
    defaultWebConfig.landing_hero.slides?.[0]?.url ??
    '/images/blog-hero-city.png'

  return (
    <main className="min-h-screen bg-background">
      <section
        className="relative isolate mb-10 bg-cover bg-center px-4 py-14 text-left md:mb-14 md:px-6 md:py-20 lg:px-8"
        style={{ backgroundImage: `url('${heroImage}')` }}
      >
        <div className="absolute inset-0 -z-10 bg-primary/80" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-primary via-secondary/85 to-primary/35" />
        <div className="mx-auto max-w-[1200px] space-y-3">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-surface/75 md:text-xs">
            <span>Beranda</span>
            <span className="text-surface/45">/</span>
            <span className="text-surface">Agenda & Program Kerja</span>
          </div>
          <h1 className="max-w-3xl font-heading text-3xl font-extrabold leading-tight text-surface md:text-5xl">
            Agenda & Program Kerja
          </h1>
          <p className="max-w-xl text-sm leading-6 text-surface/80 md:text-base md:leading-7">
            Telusuri jejak langkah, pergerakan berkala, serta rancangan pengabdian strategis Kabinet Sri Nanggala Wira Perkasa.
          </p>
        </div>
      </section>

      <section className="px-4 pb-12 md:px-6 md:pb-16 lg:px-8">
        <div className="mx-auto grid max-w-[1200px] gap-10 lg:grid-cols-12 lg:gap-12">
          <section className="lg:col-span-5">
            <div className="mb-6 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-accent" aria-hidden="true" />
              <h2 className="font-heading text-lg font-extrabold text-primary">
                Agenda Terdekat
              </h2>
            </div>

            <div className="space-y-5">
              {events.length > 0 ? (
                events.map((agenda) => (
                  <article
                    key={agenda.id}
                    className="relative overflow-hidden rounded-2xl border border-border bg-surface p-5 transition-colors hover:border-accent/35"
                  >
                    <span className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-accent to-secondary" />
                    <div className="pl-2">
                      <time
                        dateTime={agenda.startDate.toISOString()}
                        className="mb-3 inline-flex rounded-md bg-surface-alt px-2.5 py-1 text-[11px] font-bold text-secondary"
                      >
                        {formatEventDate(agenda.startDate)}
                      </time>
                      <Link href={`/event/${agenda.id}`} className="group block">
                        <h3 className="font-heading text-base font-extrabold leading-snug text-primary transition-colors group-hover:text-accent">
                          {agenda.title}
                        </h3>
                      </Link>
                      <p className="mt-2 line-clamp-3 text-xs leading-6 text-text-secondary md:text-sm">
                        {stripHtml(agenda.description)}
                      </p>
                      <div className="mt-3 flex items-center gap-1.5 text-[11px] font-medium text-text-muted">
                        <MapPin className="h-3.5 w-3.5 shrink-0 text-text-muted" aria-hidden="true" />
                        <span className="truncate">{agenda.location}</span>
                      </div>
                    </div>
                  </article>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-border bg-surface p-6 text-sm text-text-secondary">
                  Belum ada agenda terdekat.
                </div>
              )}
            </div>
          </section>

          <section className="lg:col-span-7">
            <div className="mb-6 flex items-center gap-2">
              <Star className="h-5 w-5 text-accent" aria-hidden="true" />
              <h2 className="font-heading text-lg font-extrabold text-primary">
                Program Kerja Unggulan
              </h2>
            </div>

            <div className="space-y-5">
              {programKerja.length > 0 ? (
                programKerja.map((proker) => {
                  const StatusIcon = getStatusIcon(proker.status)

                  return (
                    <article
                      key={proker.id}
                      className="rounded-2xl border border-border bg-surface p-5 transition-colors hover:border-accent/35 md:p-6"
                    >
                      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <span className="inline-flex items-center gap-1.5 rounded-md bg-surface-alt px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-text-secondary">
                            <Tag className="h-3 w-3" aria-hidden="true" />
                            {proker.department.name}
                          </span>
                          <h3 className="mt-2 font-heading text-lg font-extrabold leading-snug text-primary">
                            {proker.name}
                          </h3>
                        </div>

                        <Badge tone={getStatusTone(proker.status)} className="shrink-0">
                          <StatusIcon className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
                          {getStatusText(proker.status)}
                        </Badge>
                      </div>

                      <p className="border-l-2 border-border pl-3 text-sm leading-7 text-text-secondary">
                        {proker.description || 'Deskripsi program kerja belum tersedia.'}
                      </p>

                      <div className="mt-4 rounded-xl border border-border bg-surface-alt p-3.5">
                        <span className="block text-[10px] font-extrabold uppercase tracking-[0.14em] text-accent">
                          Output & Target Capaian
                        </span>
                        <div className="mt-2 grid gap-2 text-xs leading-5 text-text-secondary sm:grid-cols-2">
                          <p>
                            <span className="font-bold text-primary">Status:</span>{' '}
                            {getStatusText(proker.status)}
                          </p>
                          <p>
                            <span className="font-bold text-primary">Anggaran:</span>{' '}
                            {formatBudget(proker.budgetPlan)}
                          </p>
                        </div>
                      </div>
                    </article>
                  )
                })
              ) : (
                <div className="rounded-2xl border border-dashed border-border bg-surface p-6 text-sm text-text-secondary">
                  Belum ada program kerja terdaftar.
                </div>
              )}
            </div>
          </section>
        </div>
      </section>
    </main>
  )
}
