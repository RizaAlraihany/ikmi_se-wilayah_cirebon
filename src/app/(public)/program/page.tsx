import Link from 'next/link'
import { ArrowRight, Calendar, MapPin } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { getPublicPrograms, programPlainText } from '@/features/public/public-program'
import { deriveProgramStatus, programStatusLabel, type ProgramDerivedStatus } from '@/features/programs/domain'
import { siteUrl } from '@/core/seo/site'
import type { Metadata } from 'next'
import { PublicPageHero } from '../_components/public-page-hero'

export const metadata: Metadata = {
  title: 'Program Kerja Publik',
  description: 'Daftar semua Program Kerja publik IKMI Cirebon.',
  alternates: { canonical: `${siteUrl}/program` },
  openGraph: {
    title: 'Program Kerja Publik IKMI Cirebon',
    description: 'Daftar semua Program Kerja publik IKMI Cirebon.',
    url: `${siteUrl}/program`,
    type: 'website',
  },
}

export const dynamic = 'force-dynamic'

function getProgramStatusTone(status: ProgramDerivedStatus) {
  if (status === 'ONGOING') return 'success'
  if (status === 'UPCOMING') return 'warning'
  if (status === 'CANCELLED' || status === 'POSTPONED') return 'danger'
  if (status === 'COMPLETED') return 'accent'
  return 'surface'
}

function formatDate(date: Date | null) {
  return date ? new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Jakarta' }).format(date) : 'Jadwal menyusul'
}

export default async function PublicProgramListPage() {
  const programs = await getPublicPrograms()

  return (
    <main className="public-page-root min-h-screen">
      <PublicPageHero
        items={[{ label: 'Program' }]}
        title="Program IKMI Cirebon"
        lead="Program kerja publik yang disusun berdasarkan unit, jadwal, dan dampak yang ingin dicapai."
        image="https://res.cloudinary.com/dsgldeuuy/image/upload/v1781228245/ChatGPT_Image_12_Jun_2026_08.31.44_bnzje5.png"
      />
      <section className="public-page-content public-container" aria-label="Daftar Program">
        {programs.length ? <div className="divide-y divide-border border-y border-border">{programs.map((program, index) => {
          const status = deriveProgramStatus(program)
          const description = programPlainText(program.description)
          return <article key={program.id} className="grid gap-5 py-7 md:grid-cols-[3rem_minmax(0,1fr)_13rem] md:gap-7 md:py-9"><span className="font-heading text-sm font-extrabold text-text-muted">{String(index + 1).padStart(2, '0')}</span><div><div className="flex flex-wrap items-center gap-2"><p className="text-xs font-extrabold uppercase tracking-[0.14em] text-accent">{program.department.name}</p><Badge tone={getProgramStatusTone(status)}>{programStatusLabel(status)}</Badge></div><h2 className="mt-3 font-heading text-2xl font-extrabold leading-snug text-primary md:text-3xl">{program.name}</h2>{description ? <p className="mt-3 max-w-3xl line-clamp-3 whitespace-pre-line text-sm leading-7 text-text-secondary">{description}</p> : null}</div><div className="flex flex-col items-start gap-2 text-xs text-text-secondary md:items-end md:text-right"><span className="inline-flex items-center gap-2"><Calendar className="h-4 w-4 text-accent" aria-hidden="true" />{formatDate(program.plannedStart)}</span>{program.location ? <span className="inline-flex items-center gap-2"><MapPin className="h-4 w-4 text-accent" aria-hidden="true" />{program.location}</span> : null}<Link href={program.slug ? `/program/${program.slug}` : '/program'} className="mt-3 inline-flex min-h-11 items-center gap-2 font-bold text-primary hover:text-accent">Lihat Program <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link></div></article>
        })}</div> : <div className="border-l-2 border-accent py-8 pl-5"><h2 className="font-heading text-xl font-extrabold text-primary">Belum ada Program publik</h2><p className="mt-2 text-sm text-text-secondary">Program yang sudah dipublikasikan akan muncul di halaman ini.</p></div>}
      </section>
    </main>
  )
}
