import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ArrowRight, CalendarDays, Clock, MapPin, Repeat2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { ButtonLink } from '@/components/ui/button'
import { deriveAgendaStatus, agendaStatusLabel, type AgendaDerivedStatus } from '@/features/agendas/domain'
import { getPublicAgendaBySlug } from '@/features/public/public-agenda'
import { publicationPath } from '@/features/blog/publication-routes'
import { publicPlainText } from '@/features/public/public-text'
import { breadcrumbStructuredData, serializeStructuredData } from '@/core/seo/structured-data'
import { siteUrl } from '@/core/seo/site'
import { PublicPageHero } from '../../_components/public-page-hero'

type Props = { params: Promise<{ slug: string }> }

function statusTone(status: AgendaDerivedStatus) {
  if (status === 'BERJALAN') return 'success'
  if (status === 'AKAN_DATANG') return 'warning'
  if (status === 'DIBATALKAN' || status === 'DITUNDA') return 'danger'
  if (status === 'SELESAI') return 'accent'
  return 'surface'
}

function formatDateTime(value: Date) {
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: 'Asia/Jakarta',
  }).format(value)
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const agenda = await getPublicAgendaBySlug(slug)
  if (!agenda) return { title: 'Agenda Tidak Ditemukan', robots: { index: false, follow: false } }
  const description = publicPlainText(agenda.description).slice(0, 150)
  const canonicalUrl = `${siteUrl}/agenda/${slug}`

  return {
    title: agenda.name,
    description: description || `Detail agenda kegiatan ${agenda.name} oleh IKMI Cirebon.`,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: `${agenda.name} | IKMI Cirebon`,
      description: description || `Detail agenda kegiatan ${agenda.name} oleh IKMI Cirebon.`,
      url: canonicalUrl,
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title: agenda.name,
      description,
    },
  }
}

export default async function PublicAgendaDetailPage({ params }: Props) {
  const { slug } = await params
  const agenda = await getPublicAgendaBySlug(slug)
  if (!agenda) notFound()

  const status = deriveAgendaStatus({
    startDatetime: agenda.startDatetime,
    endDatetime: agenda.endDatetime,
    status: agenda.status,
    scheduleType: agenda.scheduleType,
  })

  const description = publicPlainText(agenda.description)
  const jsonLd = serializeStructuredData({
    '@context': 'https://schema.org',
    '@graph': [
      breadcrumbStructuredData([
        { name: 'Beranda', path: '/' },
        { name: 'Agenda', path: '/agenda' },
        { name: agenda.name, path: `/agenda/${slug}` },
      ]),
    ],
  })

  return (
    <main className="public-page-root min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <PublicPageHero
        items={[
          { label: 'Agenda', href: '/agenda' },
          { label: agenda.name },
        ]}
        title={agenda.name}
        lead={description}
        image="https://res.cloudinary.com/dsgldeuuy/image/upload/v1781225577/ChatGPT_Image_12_Jun_2026_07.49.13_wzkx4s.png"
      >
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Badge tone={statusTone(status)}>{agendaStatusLabel(status)}</Badge>
          {agenda.scheduleType === 'RECURRING' ? (
            <span className="inline-flex items-center gap-1 text-xs font-bold text-accent">
              <Repeat2 className="h-4 w-4" aria-hidden="true" />
              Berulang
            </span>
          ) : null}
          {agenda.organizationalUnit?.name ? (
            <span className="text-xs font-bold uppercase tracking-[0.12em] text-white/80">
              {agenda.organizationalUnit.name}
            </span>
          ) : null}
        </div>
      </PublicPageHero>

      <div className="public-container public-page-content grid max-w-5xl gap-10 md:grid-cols-[minmax(0,1.4fr)_minmax(16rem,0.6fr)]">
        <article className="space-y-8">
          <section className="border-y border-border py-6" aria-labelledby="agenda-schedule-heading">
            <h2 id="agenda-schedule-heading" className="font-heading text-xl font-extrabold text-primary">Jadwal dan lokasi</h2>
            <dl className="mt-5 space-y-4 text-sm text-text-secondary">
              <div className="flex items-start gap-3"><Clock className="mt-0.5 h-5 w-5 shrink-0 text-accent" aria-hidden="true" />
                <div>
                  <dt className="font-bold text-primary">Waktu</dt>
                  <dd className="mt-1">{agenda.startDatetime ? formatDateTime(agenda.startDatetime) : 'Belum mempunyai tanggal tetap'}{agenda.endDatetime ? ` — ${formatDateTime(agenda.endDatetime)}` : ''}</dd>
                </div>
              </div>
              {agenda.location ?
                <div className="flex items-start gap-3"><MapPin className="mt-0.5 h-5 w-5 shrink-0 text-accent" aria-hidden="true" />
                  <div>
                    <dt className="font-bold text-primary">Lokasi</dt>
                    <dd className="mt-1">{agenda.location}</dd>
                  </div>
                </div> : null}
              <div className="flex items-start gap-3"><CalendarDays className="mt-0.5 h-5 w-5 shrink-0 text-accent" aria-hidden="true" />
                <div>
                  <dt className="font-bold text-primary">Jenis jadwal</dt>
                  <dd className="mt-1">{agenda.scheduleType.replaceAll('_', ' ')}</dd>
                </div>
              </div>
            </dl>
          </section>

          {agenda.program || agenda.relativeToProgram ?
            <section aria-labelledby="agenda-program-heading">
              <h2 id="agenda-program-heading" className="font-heading text-xl font-extrabold text-primary">Program terkait</h2>
              <div className="mt-4 divide-y divide-border border-y border-border">{[agenda.program, agenda.relativeToProgram].filter(Boolean).map((program) => program?.slug ? <Link key={program.slug} href={`/program/${program.slug}`} className="flex min-h-14 items-center justify-between gap-3 py-3 font-bold text-primary hover:text-accent">{program.name}<ArrowRight className="h-4 w-4" aria-hidden="true" /></Link> : null)}
              </div>
            </section> : null}
        </article>

        <aside className="space-y-8">
          {agenda.posts.length ?
            <section aria-labelledby="agenda-publication-heading">
              <h2 id="agenda-publication-heading" className="font-heading text-lg font-extrabold text-primary">Publikasi terkait</h2>
              <div className="mt-3 divide-y divide-border border-y border-border">{agenda.posts.map((post) => <Link key={post.id} href={publicationPath(post.slug)} className="block py-3 text-sm font-bold text-primary hover:text-accent">
                <span className="block text-[10px] uppercase tracking-wide text-text-secondary">{post.category.name}</span>{post.title}</Link>)}
              </div>
            </section> : null}
          <ButtonLink href="/agenda" variant="outline" className="w-full"><ArrowLeft className="h-4 w-4" aria-hidden="true" />Semua Agenda</ButtonLink>
        </aside>
      </div>
    </main>
  )
}
