import { CalendarDays, Clock, MapPin, Repeat2 } from 'lucide-react'
import Link from 'next/link'

import { Badge } from '@/components/ui/badge'
import {
  agendaStatusLabel,
  deriveAgendaStatus,
  type AgendaDerivedStatus,
} from '@/features/agendas/domain'
import { getPublicAgendaOccurrences } from '@/features/public/public-agenda'
import { publicPlainText } from '@/features/public/public-text'

import { PublicPageHero } from '../_components/public-page-hero'

function statusTone(status: AgendaDerivedStatus) {
  if (status === 'BERJALAN') return 'success'
  if (status === 'AKAN_DATANG') return 'warning'
  if (status === 'DIBATALKAN' || status === 'DITUNDA') return 'danger'
  if (status === 'SELESAI') return 'accent'
  return 'surface'
}

export async function AgendaListingPage() {
  const agendas = await getPublicAgendaOccurrences()

  return (
    <main className="public-page-root min-h-screen">
      <PublicPageHero
        items={[{ label: 'Agenda' }]}
        title="Agenda IKMI Cirebon"
        lead="Agenda publik diurutkan berdasarkan waktu agar rencana kegiatan mudah dipindai."
        image="https://res.cloudinary.com/dsgldeuuy/image/upload/v1781225577/ChatGPT_Image_12_Jun_2026_07.49.13_wzkx4s.png"
      />
      <section className="public-page-content public-container" aria-label="Daftar Agenda">
        {agendas.length ? <div className="divide-y divide-border border-y border-border">{agendas.map((agenda) => {
          const status = deriveAgendaStatus({ startDatetime: agenda.start, endDatetime: agenda.end, status: agenda.status, scheduleType: 'FIXED_DATE' })
          const description = publicPlainText(agenda.description)
          return (
            <article key={agenda.id} className="grid gap-5 py-7 md:grid-cols-[10rem_minmax(0,1fr)_13rem] md:gap-7 md:py-9">
              <div><time dateTime={agenda.start.toISOString()} className="block font-heading text-xl font-extrabold text-accent">{new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', timeZone: 'Asia/Jakarta' }).format(agenda.start)}</time>
              <p className="mt-1 text-xs font-semibold text-text-secondary">{new Intl.DateTimeFormat('id-ID', { year: 'numeric', timeZone: 'Asia/Jakarta' }).format(agenda.start)}</p>
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2"><Badge tone={statusTone(status)}>{agendaStatusLabel(status)}</Badge>{agenda.scheduleType === 'RECURRING' ?
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-accent"><Repeat2 className="h-3.5 w-3.5" aria-hidden="true" />Berulang</span> : null}
              </div>
              <h2 className="mt-3 break-words font-heading text-2xl font-extrabold leading-snug text-primary"><Link href={`/agenda/${agenda.slug}`} className="inline-flex min-h-11 items-center hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">{agenda.name}</Link>
              </h2>
              {description ?
                <p className="mt-3 max-w-3xl line-clamp-3 whitespace-pre-line break-words text-sm leading-7 text-text-secondary">{description}</p> : null}
            </div>
            <div className="min-w-0 space-y-2 break-words text-xs text-text-secondary md:text-right">
              <p className="inline-flex items-center gap-2 md:justify-end"><Clock className="h-4 w-4 text-accent" aria-hidden="true" />{new Intl.DateTimeFormat('id-ID', { timeStyle: 'short', timeZone: 'Asia/Jakarta' }).format(agenda.start)} WIB
              </p>
              {agenda.location ?
                <p className="flex items-center gap-2 md:justify-end"><MapPin className="h-4 w-4 text-accent" aria-hidden="true" />{agenda.location}
                </p> : null}
              {agenda.organizationalUnitName ?
                <p className="flex items-center gap-2 md:justify-end"><CalendarDays className="h-4 w-4 text-accent" aria-hidden="true" />{agenda.organizationalUnitName}
                </p> : null}
            </div>
          </article>
          )
        })}
        </div> :
          <div className="border-l-2 border-accent py-8 pl-5">
            <h2 className="font-heading text-xl font-extrabold text-primary">Belum ada Agenda publik</h2>
            <p className="mt-2 text-sm text-text-secondary">Agenda yang sudah dipublikasikan akan muncul di halaman ini.</p>
          </div>}
      </section>
    </main>
  )
}
